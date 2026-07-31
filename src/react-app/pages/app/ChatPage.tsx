import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { parseChatArtifact, parseChatWorking, type ChatWorking } from "../../../shared/beacon-analytics";
import type { ResolvedDateTimePrefs } from "../../../shared/datetime";
import { DEMO_FIXTURE_ID_TO_CONVERSATION_ID } from "../../../shared/demo-global-chats";
import {
	ArchiveIcon,
	ChatIcon,
	CheckIcon,
	GlobeIcon,
	MenuIcon,
	PinIcon,
	PlusIcon,
	SendIcon,
	SlackIcon,
	SparkleIcon,
	SpinnerIcon,
	ShareIcon,
	UserIcon,
} from "../../components/Icons";
import { ChatArtifactView } from "./ChatArtifactView";
import { ChatOverflowMenu, ScopeConfirmDialog, type ChatMenuAction } from "./ChatMenu";
import { CodeHighlight } from "./CodeHighlight";
import { CONNECTOR_CATEGORY_META, CONNECTOR_META } from "./ConnectorPills";
import { MessageBody } from "./MessageBody";
import { ShareChatModal, type ShareTarget } from "./ShareChatModal";
import { UserAvatar } from "./UserAvatar";
import { UserChip } from "./UserChip";
import { useAppAuth } from "./context";
import {
	DemoNote,
	ErrorBanner,
	GENERATION_MIN_MS,
	ListPagination,
	Modal,
	Pill,
	RelativeTime,
	ThinkingBubble,
	Tooltip,
	buildGenerationPipeline,
	formatRelative,
} from "./ui";
import { useFeatureFlag } from "./featureFlags";
import { useSelfAvatar } from "./selfAvatar";
import { formatWithPrefs, useCompanySettings, useResolvedDateTimePrefs } from "./companySettings";
import type { ChatMessage, Conversation } from "./types";
import { normalizeProfileName, openUserProfile } from "./userProfile";
import { useQueryClient } from "@tanstack/react-query";
import { formatDisplayCost } from "../../../shared/currency";
import { formatLatencyMs, formatTokenCount } from "../../../shared/usage";
import logo from "../../assets/lumantic-logo.png";

type ChatScope = "personal" | "global";

const CHAT_LIST_PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 40;

type MessagesPage = { messages: ChatMessage[]; hasMore: boolean };
type ConversationsPage = { conversations: Conversation[]; total: number; page: number; pageSize: number };

type GlobalSource = { kind: "app" } | { kind: "slack"; channel: string };

type ScopeConfirm =
	| { mode: "make-global"; kind: "personal"; id: number }
	| { mode: "make-private"; kind: "api"; id: number };

function sortConversations(list: Conversation[]) {
	return [...list].sort((a, b) => {
		const ap = a.pinned ? 1 : 0;
		const bp = b.pinned ? 1 : 0;
		if (ap !== bp) return bp - ap;
		return (b.updated_at || "").localeCompare(a.updated_at || "");
	});
}

function formatMessageStamp(iso: string, prefs: ResolvedDateTimePrefs): string {
	if (!iso) return "";
	return formatWithPrefs(iso, prefs, { dateStyle: "medium", timeStyle: "short" });
}

function normalizeSlackUsername(value: string | null | undefined): string {
	return (value ?? "").trim().replace(/^@+/, "").toLowerCase();
}

function isSelfSlackAuthor(
	authorSlackUsername: string | null | undefined,
	selfSlackUsername: string | null | undefined,
): boolean {
	const a = normalizeSlackUsername(authorSlackUsername);
	const b = normalizeSlackUsername(selfSlackUsername);
	return Boolean(a && b && a === b);
}

function conversationSource(c: Conversation): GlobalSource {
	if (c.source_kind === "slack" && c.source_channel) {
		return { kind: "slack", channel: c.source_channel };
	}
	return { kind: "app" };
}

function isGlobalAuthorYou(
	c: Conversation,
	userName: string | null | undefined,
	userSlackUsername: string | null | undefined,
): boolean {
	if (isSelfSlackAuthor(c.author_slack_username, userSlackUsername)) return true;
	if (!c.author_name) return true;
	return Boolean(userName && normalizeProfileName(userName) === normalizeProfileName(c.author_name));
}

function SourceBadge({ source, compact = false }: { source: GlobalSource; compact?: boolean }) {
	if (source.kind === "slack") {
		const label = `Asked in Slack · #${source.channel}`;
		if (compact) {
			return (
				<Tooltip content={label}>
					<span
						aria-label={label}
						className="inline-flex size-5 items-center justify-center rounded-md border border-sky-500/25 bg-sky-500/15 text-sky-300"
					>
						<SlackIcon className="size-3" />
					</span>
				</Tooltip>
			);
		}
		return (
			<Pill tone="sky">
				<SlackIcon className="size-3.5" />
				{label}
			</Pill>
		);
	}

	const label = "Asked in app";
	if (compact) {
		return (
			<Tooltip content={label}>
				<span
					aria-label={label}
					className="inline-flex size-5 items-center justify-center rounded-md border border-violet-500/25 bg-violet-500/15 text-violet-200"
				>
					<ChatIcon className="size-3" />
				</span>
			</Tooltip>
		);
	}
	return (
		<Pill tone="violet">
			<ChatIcon className="size-3.5" />
			{label}
		</Pill>
	);
}

function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

/** Keep the Generating phases visible long enough to complete the sequence. */
const MIN_THINK_MS = GENERATION_MIN_MS;

const EMPTY_WORKING: ChatWorking = {
	sql: [],
	assumptions: ["Working details were not stored for this reply."],
};

function formatLatencyDetail(ms: number): string {
	if (!Number.isFinite(ms) || ms < 0) return "";
	if (ms < 1000) return `${Math.round(ms)} ms`;
	const seconds = ms / 1000;
	if (seconds < 10) return `${seconds.toFixed(1)} seconds`;
	return `${Math.round(seconds)} seconds`;
}

function ReplyStatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
	return (
		<div className="rounded-xl border border-violet-500/15 bg-white/[0.03] px-3 py-2.5">
			<p className="text-[11px] font-medium tracking-wide text-violet-400/55">{label}</p>
			<p className="mt-1 text-base font-semibold tabular-nums tracking-tight text-violet-50">{value}</p>
			{hint ? <p className="mt-0.5 text-[11px] leading-snug text-violet-400/45">{hint}</p> : null}
		</div>
	);
}

function ReplyMetaButton({
	working,
	confidence,
	inputTokens,
	outputTokens,
	costUsd,
	latencyMs,
	displayCurrency,
}: {
	working: ChatWorking | null;
	confidence: number | null;
	inputTokens: number | null;
	outputTokens: number | null;
	costUsd: number | null;
	latencyMs: number | null;
	displayCurrency: string;
}) {
	const [open, setOpen] = useState(false);
	const data = working ?? EMPTY_WORKING;
	const pipeline = data.pipeline ?? buildGenerationPipeline("");
	const connectors = (data.connectors ?? []).filter((id) => CONNECTOR_META[id]);
	const hasUsage = inputTokens != null && outputTokens != null && costUsd != null;
	const hasMeta = confidence != null || hasUsage || latencyMs != null || connectors.length > 0;
	const latencyLabel = latencyMs != null ? formatLatencyMs(latencyMs) : "";
	const confidencePct = confidence != null ? Math.round(confidence * 100) : null;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Reply details"
				className="flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-violet-500/20 bg-white/[0.02] px-2 py-1 text-[11px] font-medium text-violet-300/90 transition hover:border-violet-400/40 hover:text-violet-100"
			>
				{!hasMeta && <span>Details</span>}
				{confidence != null && (
					<span
						className={`inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium leading-none ${
							confidenceTone(confidence) === "emerald"
								? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
								: confidenceTone(confidence) === "amber"
									? "border-amber-500/25 bg-amber-500/15 text-amber-300"
									: "border-rose-500/25 bg-rose-500/15 text-rose-300"
						}`}
					>
						{confidencePct}%
					</span>
				)}
				{latencyLabel ? (
					<span
						title="Time to answer"
						className="inline-flex items-center rounded-full border border-violet-500/20 bg-white/[0.03] px-1.5 py-px text-[10px] font-medium leading-none text-violet-300/65 tabular-nums"
					>
						{latencyLabel}
					</span>
				) : null}
				{hasUsage && (
					<span
						title={`${formatTokenCount(inputTokens)} input · ${formatTokenCount(outputTokens)} output`}
						className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-white/[0.03] px-1.5 py-px text-[10px] font-medium leading-none text-violet-300/65 tabular-nums"
					>
						<span>{formatTokenCount(inputTokens)} in</span>
						<span className="text-violet-400/35" aria-hidden>
							·
						</span>
						<span>{formatTokenCount(outputTokens)} out</span>
						<span className="text-violet-400/35" aria-hidden>
							·
						</span>
						<span>{formatDisplayCost(costUsd, displayCurrency)}</span>
					</span>
				)}
				{connectors.length > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-white/[0.03] px-1.5 py-px">
						{connectors.map((id) => {
							const meta = CONNECTOR_META[id];
							return (
								<span key={id} title={meta.label} className="inline-flex text-violet-100/90">
									{meta.icon("size-3.5")}
									<span className="sr-only">{meta.label}</span>
								</span>
							);
						})}
					</span>
				)}
			</button>
			{open && (
				<Modal title="Reply details" onClose={() => setOpen(false)} size="lg">
					<div className="space-y-5">
						{hasMeta && (confidencePct != null || latencyMs != null || hasUsage) && (
							<section>
								<p className="mb-2.5 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">
									Reply stats
								</p>
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
									{confidencePct != null && (
										<ReplyStatCard
											label="Confidence"
											value={`${confidencePct}%`}
											hint={
												confidenceTone(confidence!) === "emerald"
													? "Strong match to sources and memories"
													: confidenceTone(confidence!) === "amber"
														? "Partial match; treat as directional"
														: "Low match; verify before acting"
											}
										/>
									)}
									{latencyMs != null && (
										<ReplyStatCard label="Time to answer" value={formatLatencyDetail(latencyMs)} />
									)}
									{hasUsage && (
										<>
											<ReplyStatCard
												label="Tokens in"
												value={formatTokenCount(inputTokens)}
												hint="Prompt, context, and memories"
											/>
											<ReplyStatCard
												label="Tokens out"
												value={formatTokenCount(outputTokens)}
												hint="Generated reply"
											/>
											<ReplyStatCard
												label="Total tokens"
												value={formatTokenCount(inputTokens + outputTokens)}
											/>
											<ReplyStatCard
												label="Cost"
												value={formatDisplayCost(costUsd, displayCurrency)}
												hint="Change currency in Settings"
											/>
										</>
									)}
								</div>
							</section>
						)}
						<section>
							<p className="mb-2 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">
								How Lumantic answered
							</p>
							<ol className="space-y-1.5">
								{pipeline.map((step) => (
									<li key={step.id} className="flex items-start gap-2 text-sm text-violet-200/85">
										<span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
											<CheckIcon className="size-2.5" />
										</span>
										<span className="min-w-0">
											<span className="font-medium text-violet-100/90">{step.label}</span>
											{step.detail ? (
												<span className="mt-0.5 block text-xs text-violet-400/55">{step.detail}</span>
											) : null}
										</span>
									</li>
								))}
							</ol>
						</section>
						{connectors.length > 0 && (
							<section>
								<p className="mb-2 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">
									Sources consulted
								</p>
								<ul className="space-y-2">
									{connectors.map((id) => {
										const meta = CONNECTOR_META[id];
										const category = CONNECTOR_CATEGORY_META[meta.category];
										return (
											<li
												key={id}
												className={`flex gap-3 rounded-xl border px-3 py-2.5 ${meta.className}`}
											>
												<span className="mt-0.5 shrink-0">{meta.icon("size-5")}</span>
												<div className="min-w-0">
													<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
														<p className="text-sm font-semibold text-violet-50">{meta.label}</p>
														<p className="text-[11px] font-medium text-violet-200/45">{category.label}</p>
													</div>
													<p className="mt-1 text-xs leading-relaxed text-violet-100/70">{meta.blurb}</p>
												</div>
											</li>
										);
									})}
								</ul>
							</section>
						)}
						<section>
							<p className="mb-2 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">SQL</p>
							{data.sql.length === 0 ? (
								<p className="text-sm text-violet-400/55">No warehouse query for this reply.</p>
							) : (
								<div className="space-y-2">
									{data.sql.map((q, i) => (
										<CodeHighlight key={i} code={q} language="sql" filename="warehouse.sql" />
									))}
								</div>
							)}
						</section>
						<section>
							<p className="mb-2 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">Assumptions</p>
							<ul className="space-y-1.5">
								{data.assumptions.map((a, i) => (
									<li key={i} className="flex gap-2 text-sm leading-relaxed text-violet-200/85">
										<span className="mt-2 size-1 shrink-0 rounded-full bg-violet-400/50" />
										<span>{a}</span>
									</li>
								))}
							</ul>
						</section>
						{data.notes && data.notes.length > 0 && (
							<section>
								<p className="mb-2 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">Notes</p>
								<ul className="space-y-1.5">
									{data.notes.map((n, i) => (
										<li key={i} className="flex gap-2 text-sm leading-relaxed text-violet-200/75">
											<span className="mt-2 size-1 shrink-0 rounded-full bg-violet-400/35" />
											<span>{n}</span>
										</li>
									))}
								</ul>
							</section>
						)}
					</div>
				</Modal>
			)}
		</>
	);
}

function confidenceTone(confidence: number): "emerald" | "amber" | "rose" | "violet" {
	if (confidence >= 0.8) return "emerald";
	if (confidence >= 0.55) return "amber";
	return "rose";
}

function MessageBubble({
	message,
	animate,
	authorName,
	authorIsYou,
	onSaveSuggestion,
	savedSuggestion,
	displayCurrency,
	dateTimePrefs,
}: {
	message: ChatMessage;
	animate: boolean;
	authorName: string;
	authorIsYou?: boolean;
	onSaveSuggestion: (message: ChatMessage) => void;
	savedSuggestion: boolean;
	displayCurrency: string;
	dateTimePrefs: ResolvedDateTimePrefs;
}) {
	const self = useSelfAvatar();
	const isUser = message.role === "user";
	const artifact = !isUser ? parseChatArtifact(message.artifact) : null;
	const working = !isUser ? parseChatWorking(message.working) : null;
	const confidence =
		!isUser && typeof message.confidence === "number" && Number.isFinite(message.confidence)
			? Math.min(1, Math.max(0, message.confidence))
			: null;
	const inputTokens = !isUser && typeof message.input_tokens === "number" ? message.input_tokens : null;
	const outputTokens = !isUser && typeof message.output_tokens === "number" ? message.output_tokens : null;
	const costUsd = !isUser && typeof message.cost_usd === "number" ? message.cost_usd : null;
	const latencyMs = !isUser && typeof message.latency_ms === "number" ? message.latency_ms : null;
	const displayName = isUser ? authorName : "Lumantic";
	const stamp = formatMessageStamp(message.created_at, dateTimePrefs);
	const avatarUrl =
		isUser &&
		self.avatarUrl &&
		(authorIsYou || (self.name && normalizeProfileName(self.name) === normalizeProfileName(authorName)))
			? self.avatarUrl
			: null;

	return (
		<div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} ${animate ? "animate-rise" : ""}`}>
			{isUser ? (
				<button
					type="button"
					onClick={() => openUserProfile(authorName)}
					className="mt-0.5 shrink-0 self-end rounded-full transition outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400/50"
					aria-label={`View ${authorName}'s profile`}
				>
					<UserAvatar name={authorName} avatarUrl={avatarUrl} sizeClass="size-7" textClass="text-[10px]" />
				</button>
			) : (
				<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-violet-700">
					<img src={logo} alt="" className="size-4 drop-shadow-[0_0_6px_rgba(184,148,255,0.5)]" />
				</span>
			)}
			<div className={`flex flex-col gap-1.5 ${isUser ? "max-w-[75%] items-end" : "w-full max-w-2xl items-start"}`}>
				<div
					className={`rounded-2xl px-3.5 pt-2 pb-1.5 ${
						isUser
							? "bg-gradient-to-r from-violet-600 to-violet-500 text-white"
							: "w-full border border-violet-500/15 bg-white/[0.03]"
					}`}
				>
					<div className={`mb-1 flex items-center ${isUser ? "justify-end" : "justify-start"}`}>
						{isUser ? (
							<button
								type="button"
								onClick={() => openUserProfile(authorName)}
								className="text-[11px] font-semibold text-violet-50/95 transition hover:text-white"
							>
								{authorIsYou ? (
									<span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-1.5 py-px text-[10px] font-semibold tracking-wide text-white">
										You
									</span>
								) : (
									displayName
								)}
							</button>
						) : (
							<span className="text-[11px] font-semibold text-violet-100/90">{displayName}</span>
						)}
					</div>
					{isUser ? (
						<p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
					) : (
						<MessageBody content={message.content} />
					)}
					{stamp ? (
						<div className="mt-1 flex justify-end">
							<time
								dateTime={message.created_at}
								className={`text-[10px] leading-none ${isUser ? "text-violet-100/55" : "text-violet-400/50"}`}
							>
								{stamp}
							</time>
						</div>
					) : null}
				</div>
				{artifact && (
					<div className="w-full min-w-0">
						<ChatArtifactView artifact={artifact} />
					</div>
				)}
				{!isUser && (
					<ReplyMetaButton
						working={working}
						confidence={confidence}
						inputTokens={inputTokens}
						outputTokens={outputTokens}
						costUsd={costUsd}
						latencyMs={latencyMs}
						displayCurrency={displayCurrency}
					/>
				)}
				{message.suggested_memory && (
					<button
						onClick={() => onSaveSuggestion(message)}
						disabled={savedSuggestion}
						className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
							savedSuggestion
								? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
								: "border-violet-500/25 text-violet-300 hover:border-violet-400/50 hover:text-violet-100"
						}`}
					>
						<SparkleIcon className="size-3" />
						{savedSuggestion ? "Added to proposed memories" : "Save as proposed memory"}
					</button>
				)}
			</div>
		</div>
	);
}

export function ChatPage({
	locationSearch = "",
	onNavigate,
}: {
	locationSearch?: string;
	onNavigate?: (to: string, opts?: { replace?: boolean }) => void;
}) {
	const { request, user } = useAppAuth();
	const queryClient = useQueryClient();
	const exampleDevBanner = useFeatureFlag("exampleDevBanner");
	const { data: company } = useCompanySettings();
	const dateTimePrefs = useResolvedDateTimePrefs();
	const displayCurrency = company?.displayCurrency ?? "USD";
	const [scope, setScope] = useState<ChatScope>("global");
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [globalApiConversations, setGlobalApiConversations] = useState<Conversation[]>([]);
	const [activeId, setActiveId] = useState<number | null>(null);
	const [activeGlobalApiId, setActiveGlobalApiId] = useState<number | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [hasMoreMessages, setHasMoreMessages] = useState(false);
	const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [pendingQuestion, setPendingQuestion] = useState("");
	const [loadingConversations, setLoadingConversations] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [error, setError] = useState("");
	const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
	const [savedSuggestions, setSavedSuggestions] = useState<Set<number>>(new Set());
	const [newestAssistantId, setNewestAssistantId] = useState<number | null>(null);
	const [scopeConfirm, setScopeConfirm] = useState<ScopeConfirm | null>(null);
	const [scopeBusy, setScopeBusy] = useState(false);
	const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
	const [showArchived, setShowArchived] = useState(false);
	const [draftNew, setDraftNew] = useState(false);
	const [personalPage, setPersonalPage] = useState(1);
	const [globalPage, setGlobalPage] = useState(1);
	const [personalTotal, setPersonalTotal] = useState(0);
	const [globalApiTotal, setGlobalApiTotal] = useState(0);
	const [personalArchived, setPersonalArchived] = useState<Conversation[]>([]);
	const [globalApiArchived, setGlobalApiArchived] = useState<Conversation[]>([]);
	const [historyWidth, setHistoryWidth] = useState(() => {
		try {
			const saved = Number(localStorage.getItem("lumantic-chat-history-width"));
			if (Number.isFinite(saved) && saved >= 240 && saved <= 520) return saved;
		} catch {
			// ignore
		}
		return 300;
	});
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const resizingRef = useRef(false);
	const sendingRef = useRef(false);
	const appliedSearchRef = useRef<string | null>(null);
	const stickToBottomRef = useRef(true);
	const loadingOlderRef = useRef(false);
	const messagesGenRef = useRef(0);
	const messagesRef = useRef(messages);
	const hasMoreMessagesRef = useRef(hasMoreMessages);

	const activeGlobalApi =
		globalApiConversations.find((c) => c.id === activeGlobalApiId) ??
		globalApiArchived.find((c) => c.id === activeGlobalApiId) ??
		null;
	const displayMessages = messages;
	const messageAuthorName =
		scope === "global" && activeGlobalApi
			? activeGlobalApi.author_name || user?.name || "You"
			: user?.name || "You";
	const messageAuthorIsYou =
		scope === "global" && activeGlobalApi
			? isGlobalAuthorYou(activeGlobalApi, user?.name, user?.slackUsername)
			: false;

	const personalActive = conversations;
	const globalApiActive = globalApiConversations;
	const archivedCount = scope === "personal" ? personalArchived.length : globalApiArchived.length;
	const hasAnyUnread =
		conversations.some((c) => Number(c.unread) > 0) ||
		globalApiConversations.some((c) => Number(c.unread) > 0) ||
		personalArchived.some((c) => Number(c.unread) > 0) ||
		globalApiArchived.some((c) => Number(c.unread) > 0);
	const listPage = scope === "personal" ? personalPage : globalPage;
	const listTotal = scope === "personal" ? personalTotal : globalApiTotal;

	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	useEffect(() => {
		hasMoreMessagesRef.current = hasMoreMessages;
	}, [hasMoreMessages]);

	async function loadConversations(listScope: ChatScope = "personal", page = 1) {
		const data = await request<ConversationsPage>(
			`/conversations?scope=${listScope}&archived=0&page=${page}&pageSize=${CHAT_LIST_PAGE_SIZE}`,
		);
		const sorted = sortConversations(data.conversations);
		if (listScope === "global") {
			setGlobalApiConversations(sorted);
			setGlobalApiTotal(data.total);
			setGlobalPage(data.page);
		} else {
			setConversations(sorted);
			setPersonalTotal(data.total);
			setPersonalPage(data.page);
		}
		return sorted;
	}

	async function loadArchivedConversations(listScope: ChatScope) {
		const data = await request<ConversationsPage>(`/conversations?scope=${listScope}&archived=1&page=1&pageSize=100`);
		const sorted = sortConversations(data.conversations);
		if (listScope === "global") setGlobalApiArchived(sorted);
		else setPersonalArchived(sorted);
		return sorted;
	}

	async function loadMessages(id: number) {
		const gen = ++messagesGenRef.current;
		setLoadingMessages(true);
		setHasMoreMessages(false);
		setLoadingOlderMessages(false);
		loadingOlderRef.current = false;
		stickToBottomRef.current = true;
		try {
			const data = await request<MessagesPage>(`/conversations/${id}/messages?limit=${MESSAGE_PAGE_SIZE}`);
			if (gen !== messagesGenRef.current) return;
			setMessages(data.messages);
			setHasMoreMessages(Boolean(data.hasMore));
			setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
			setGlobalApiConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
			void queryClient.invalidateQueries({ queryKey: ["chat-unread"] });
			requestAnimationFrame(() => {
				const el = scrollRef.current;
				if (el) el.scrollTop = el.scrollHeight;
			});
		} finally {
			if (gen === messagesGenRef.current) setLoadingMessages(false);
		}
	}

	async function loadOlderMessages() {
		const conversationId = scope === "global" ? activeGlobalApiId : activeId;
		if (conversationId == null || !hasMoreMessagesRef.current || loadingOlderRef.current || loadingMessages) return;
		const oldestId = messagesRef.current[0]?.id;
		if (oldestId == null || oldestId < 0) return;

		loadingOlderRef.current = true;
		setLoadingOlderMessages(true);
		const el = scrollRef.current;
		const prevHeight = el?.scrollHeight ?? 0;
		const prevTop = el?.scrollTop ?? 0;
		const gen = messagesGenRef.current;

		try {
			const data = await request<MessagesPage>(
				`/conversations/${conversationId}/messages?limit=${MESSAGE_PAGE_SIZE}&before=${oldestId}`,
			);
			if (gen !== messagesGenRef.current) return;
			setMessages((prev) => {
				const seen = new Set(prev.map((m) => m.id));
				const older = data.messages.filter((m) => !seen.has(m.id));
				return [...older, ...prev];
			});
			setHasMoreMessages(Boolean(data.hasMore));
			requestAnimationFrame(() => {
				const node = scrollRef.current;
				if (!node) return;
				node.scrollTop = prevTop + (node.scrollHeight - prevHeight);
			});
		} catch (err) {
			if (gen === messagesGenRef.current) {
				setError(err instanceof Error ? err.message : "Failed to load earlier messages");
			}
		} finally {
			loadingOlderRef.current = false;
			if (gen === messagesGenRef.current) setLoadingOlderMessages(false);
		}
	}

	async function fetchAllMessages(id: number) {
		const data = await request<MessagesPage>(`/conversations/${id}/messages?all=1`);
		return data.messages;
	}

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				await Promise.all([
					loadConversations("global", 1),
					loadConversations("personal", 1),
					loadArchivedConversations("global"),
					loadArchivedConversations("personal"),
				]);
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load chats");
			} finally {
				if (!cancelled) setLoadingConversations(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [request]);

	useEffect(() => {
		if (!locationSearch) {
			appliedSearchRef.current = null;
			return;
		}
		if (appliedSearchRef.current === locationSearch) return;

		const params = new URLSearchParams(locationSearch);
		const conversationId = params.get("c");
		const scopeParam = params.get("scope");
		const fixtureId = params.get("fixture");
		const newChat = params.get("new");
		const clearSearch = () => onNavigate?.("/app", { replace: true });

		if (newChat === "personal" || newChat === "global") {
			appliedSearchRef.current = locationSearch;
			queueMicrotask(() => {
				setScope(newChat);
				setShowArchived(false);
				setError("");
				setDraftNew(true);
				setMessages([]);
				setHasMoreMessages(false);
				setLoadingOlderMessages(false);
				setInput("");
				setMobileHistoryOpen(false);
				setNewestAssistantId(null);
				setActiveId(null);
				setActiveGlobalApiId(null);
			});
			clearSearch();
			setTimeout(() => inputRef.current?.focus(), 0);
			return;
		}

		if (
			(scopeParam === "personal" || scopeParam === "global") &&
			!conversationId &&
			!fixtureId
		) {
			appliedSearchRef.current = locationSearch;
			queueMicrotask(() => {
				setScope(scopeParam);
				setShowArchived(false);
				setDraftNew(false);
				setError("");
				setMobileHistoryOpen(false);
				setNewestAssistantId(null);
				if (scopeParam === "personal") {
					setActiveGlobalApiId(null);
				} else {
					setActiveId(null);
					setActiveGlobalApiId(null);
				}
			});
			clearSearch();
			return;
		}

		if (fixtureId) {
			const mappedId = DEMO_FIXTURE_ID_TO_CONVERSATION_ID[fixtureId];
			if (mappedId == null) {
				appliedSearchRef.current = locationSearch;
				clearSearch();
				return;
			}
			if (loadingConversations) return;
			appliedSearchRef.current = locationSearch;
			queueMicrotask(() => {
				setScope("global");
				setShowArchived(false);
				setDraftNew(false);
				setActiveGlobalApiId(mappedId);
				setMobileHistoryOpen(false);
				setNewestAssistantId(null);
				void loadMessages(mappedId);
			});
			clearSearch();
			return;
		}

		if (conversationId && (scopeParam === "personal" || scopeParam === "global")) {
			if (loadingConversations) return;
			const id = Number(conversationId);
			if (!Number.isFinite(id)) {
				appliedSearchRef.current = locationSearch;
				clearSearch();
				return;
			}
			appliedSearchRef.current = locationSearch;
			queueMicrotask(() => {
				setShowArchived(false);
				setDraftNew(false);
				setMobileHistoryOpen(false);
				setNewestAssistantId(null);
				if (scopeParam === "personal") {
					setScope("personal");
					setActiveId(id);
					setActiveGlobalApiId(null);
					void loadMessages(id);
				} else {
					setScope("global");
					setActiveGlobalApiId(id);
					void loadMessages(id);
				}
			});
			clearSearch();
		}
	}, [locationSearch, loadingConversations, onNavigate, request]);

	useEffect(() => {
		if (loadingConversations) return;
		if (scope !== "global" || draftNew) return;
		if (activeGlobalApiId != null) return;
		if (locationSearch) {
			const params = new URLSearchParams(locationSearch);
			if (params.get("c") || params.get("fixture") || params.get("new")) return;
		}
		const first = globalApiConversations[0];
		if (!first) return;
		setActiveGlobalApiId(first.id);
		void loadMessages(first.id);
	}, [loadingConversations, scope, draftNew, activeGlobalApiId, globalApiConversations, locationSearch]);

	useEffect(() => {
		if (loadingOlderRef.current) return;
		if (!stickToBottomRef.current && !sending) return;
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: sending ? "smooth" : "auto",
		});
	}, [messages, activeGlobalApiId, scope, sending]);

	function handleMessageScroll() {
		const el = scrollRef.current;
		if (!el) return;
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
		stickToBottomRef.current = distanceFromBottom < 96;
		if (el.scrollTop < 96) void loadOlderMessages();
	}

	async function switchScope(next: ChatScope) {
		setScope(next);
		setShowArchived(false);
		setDraftNew(false);
		setError("");
		if (next === "global") {
			setActiveGlobalApiId(null);
			try {
				await loadConversations("global", globalPage);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load global chats");
			}
		}
	}

	async function handleListPageChange(page: number) {
		try {
			if (scope === "personal") {
				setPersonalPage(page);
				await loadConversations("personal", page);
			} else {
				setGlobalPage(page);
				await loadConversations("global", page);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load chats");
		}
	}

	async function handleSelectConversation(id: number) {
		setScope("personal");
		setDraftNew(false);
		setActiveId(id);
		setActiveGlobalApiId(null);
		setMobileHistoryOpen(false);
		setNewestAssistantId(null);
		await loadMessages(id);
	}

	async function handleSelectGlobalApi(id: number) {
		setDraftNew(false);
		setActiveGlobalApiId(id);
		setMobileHistoryOpen(false);
		setNewestAssistantId(null);
		await loadMessages(id);
	}


	async function patchConversation(id: number, patch: Record<string, unknown>) {
		const data = await request<{ conversation: Conversation }>(`/conversations/${id}`, {
			method: "PUT",
			body: JSON.stringify(patch),
		});
		return data.conversation;
	}

	async function handleDeleteConversation(id: number) {
		const remaining = conversations.filter((c) => c.id !== id);
		setConversations(remaining);
		setPersonalTotal((n) => Math.max(0, n - 1));
		if (activeId === id) {
			const next = remaining[0];
			if (next) {
				setActiveId(next.id);
				void loadMessages(next.id);
			} else {
				setActiveId(null);
				setMessages([]);
				setHasMoreMessages(false);
			}
		}
		try {
			await request(`/conversations/${id}`, { method: "DELETE" });
			await loadConversations("personal", personalPage);
		} catch {
			// local removal already applied
		}
	}

	async function handleMarkAllRead() {
		setConversations((prev) => prev.map((c) => ({ ...c, unread: 0 })));
		setGlobalApiConversations((prev) => prev.map((c) => ({ ...c, unread: 0 })));
		setPersonalArchived((prev) => prev.map((c) => ({ ...c, unread: 0 })));
		setGlobalApiArchived((prev) => prev.map((c) => ({ ...c, unread: 0 })));
		void queryClient.invalidateQueries({ queryKey: ["chat-unread"] });
		try {
			await request("/conversations/mark-all-read", { method: "POST" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to mark chats as read");
			void loadConversations("personal", personalPage);
			void loadConversations("global", globalPage);
		}
	}

	async function handlePersonalMenu(id: number, action: ChatMenuAction) {
		if (action === "mark-all-read") {
			await handleMarkAllRead();
			return;
		}
		if (action === "share") {
			const conversation = conversations.find((c) => c.id === id) ?? personalArchived.find((c) => c.id === id);
			if (!conversation) return;
			const msgs = activeId === id && !hasMoreMessages ? messages : await fetchAllMessages(id);
			setShareTarget({ kind: "api", conversationId: id, title: conversation.title || "Chat", messages: msgs });
			return;
		}
		if (action === "make-global") {
			setScopeConfirm({ mode: "make-global", kind: "personal", id });
			return;
		}
		if (action === "delete") {
			await handleDeleteConversation(id);
			return;
		}
		try {
			const conversation = await patchConversation(id, {
				...(action === "pin" ? { pinned: true } : {}),
				...(action === "unpin" ? { pinned: false } : {}),
				...(action === "archive" ? { archived: true } : {}),
				...(action === "unarchive" ? { archived: false } : {}),
			});
			await loadConversations("personal", personalPage);
			if (showArchived) await loadArchivedConversations("personal");
			if (action === "archive" || action === "unarchive") {
				// keep local active list coherent even before reload settles
				setConversations((prev) => sortConversations(prev.map((c) => (c.id === id ? { ...c, ...conversation } : c))));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update chat");
		}
	}

	async function handleGlobalApiMenu(id: number, action: ChatMenuAction) {
		if (action === "mark-all-read") {
			await handleMarkAllRead();
			return;
		}
		if (action === "share") {
			const conversation =
				globalApiConversations.find((c) => c.id === id) ?? globalApiArchived.find((c) => c.id === id);
			if (!conversation) return;
			const msgs = activeGlobalApiId === id && !hasMoreMessages ? messages : await fetchAllMessages(id);
			setShareTarget({ kind: "api", conversationId: id, title: conversation.title || "Chat", messages: msgs });
			return;
		}
		if (action === "make-private") {
			setScopeConfirm({ mode: "make-private", kind: "api", id });
			return;
		}
		try {
			await patchConversation(id, {
				...(action === "pin" ? { pinned: true } : {}),
				...(action === "unpin" ? { pinned: false } : {}),
				...(action === "archive" ? { archived: true } : {}),
				...(action === "unarchive" ? { archived: false } : {}),
			});
			await loadConversations("global", globalPage);
			if (showArchived) await loadArchivedConversations("global");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update chat");
		}
	}


	function openShareForActive() {
		if (scope === "global" && activeGlobalApi) {
			void (async () => {
				const msgs = hasMoreMessages ? await fetchAllMessages(activeGlobalApi.id) : messages;
				setShareTarget({
					kind: "api",
					conversationId: activeGlobalApi.id,
					title: activeGlobalApi.title || "Chat",
					messages: msgs,
				});
			})();
			return;
		}
		if (scope === "personal" && activeId != null) {
			const conversation = conversations.find((c) => c.id === activeId);
			if (!conversation) return;
			void (async () => {
				const msgs = hasMoreMessages ? await fetchAllMessages(activeId) : messages;
				setShareTarget({
					kind: "api",
					conversationId: activeId,
					title: conversation.title || "Chat",
					messages: msgs,
				});
			})();
		}
	}

	async function confirmScopeChange() {
		if (!scopeConfirm) return;
		setScopeBusy(true);
		setError("");
		try {
			if (scopeConfirm.mode === "make-global" && scopeConfirm.kind === "personal") {
				const conversation = await patchConversation(scopeConfirm.id, { scope: "global" });
				setConversations((prev) => prev.filter((c) => c.id !== scopeConfirm.id));
				setGlobalApiConversations((prev) =>
					sortConversations([{ ...conversation, scope: "global" }, ...prev.filter((c) => c.id !== conversation.id)]),
				);
				setScope("global");
				setActiveId(null);
				await handleSelectGlobalApi(conversation.id);
			} else if (scopeConfirm.mode === "make-private" && scopeConfirm.kind === "api") {
				const conversation = await patchConversation(scopeConfirm.id, { scope: "personal" });
				setGlobalApiConversations((prev) => prev.filter((c) => c.id !== scopeConfirm.id));
				setConversations((prev) =>
					sortConversations([{ ...conversation, scope: "personal" }, ...prev.filter((c) => c.id !== conversation.id)]),
				);
				setScope("personal");
				setActiveGlobalApiId(null);
				await handleSelectConversation(conversation.id);
			}
			setScopeConfirm(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to move chat");
		} finally {
			setScopeBusy(false);
		}
	}

	async function handleNewChat() {
		setError("");
		setDraftNew(true);
		setMessages([]);
		setHasMoreMessages(false);
		setLoadingOlderMessages(false);
		stickToBottomRef.current = true;
		setInput("");
		setMobileHistoryOpen(false);
		setNewestAssistantId(null);
		if (scope === "global") {
			setActiveGlobalApiId(null);
			setActiveId(null);
		} else {
			setActiveId(null);
			setActiveGlobalApiId(null);
		}
		setTimeout(() => inputRef.current?.focus(), 0);
	}

	async function handleSend() {
		const content = input.trim();
		if (!content || sending || sendingRef.current) return;
		if (scope === "global" && !draftNew && activeGlobalApiId == null) return;
		setError("");
		setInput("");
		setPendingQuestion(content);
		setSending(true);
		sendingRef.current = true;

		const tempId = -Date.now();
		setMessages((prev) => [
			...prev,
			{ id: tempId, role: "user", content, suggested_memory: null, created_at: new Date().toISOString() },
		]);

		const thinkStarted = Date.now();
		try {
			let conversationId = scope === "global" ? activeGlobalApiId : activeId;
			if (!conversationId) {
				const created = await request<{ conversation: Conversation }>("/conversations", {
					method: "POST",
					body: JSON.stringify({ scope }),
				});
				conversationId = created.conversation.id;
				if (scope === "global") {
					setActiveGlobalApiId(conversationId);
							setGlobalPage(1);
					setGlobalApiTotal((n) => n + 1);
					setGlobalApiConversations((prev) => [created.conversation, ...prev.filter((c) => c.id !== conversationId)]);
				} else {
					setActiveId(conversationId);
					setPersonalPage(1);
					setPersonalTotal((n) => n + 1);
					setConversations((prev) => [created.conversation, ...prev.filter((c) => c.id !== conversationId)]);
				}
			}
			setDraftNew(false);

			const data = await request<{ userMessage: ChatMessage; assistantMessage: ChatMessage; title: string }>(
				`/conversations/${conversationId}/messages`,
				{ method: "POST", body: JSON.stringify({ content }) },
			);

			const elapsed = Date.now() - thinkStarted;
			if (elapsed < MIN_THINK_MS) await sleep(MIN_THINK_MS - elapsed);

			const pipeline = buildGenerationPipeline(content);
			const parsedWorking = parseChatWorking(data.assistantMessage.working);
			const assistantMessage: ChatMessage = {
				...data.assistantMessage,
				working: JSON.stringify({
					sql: parsedWorking?.sql ?? [],
					assumptions: parsedWorking?.assumptions ?? [],
					...(parsedWorking?.notes ? { notes: parsedWorking.notes } : {}),
					...(parsedWorking?.connectors ? { connectors: parsedWorking.connectors } : {}),
					pipeline,
				} satisfies ChatWorking),
			};

			setMessages((prev) => [...prev.filter((m) => m.id !== tempId), data.userMessage, assistantMessage]);
			setNewestAssistantId(assistantMessage.id);
			const stamp = new Date().toISOString();
			if (scope === "global") {
				setGlobalApiConversations((prev) =>
					sortConversations(
						prev.map((c) => (c.id === conversationId ? { ...c, title: data.title, updated_at: stamp } : c)),
					),
				);
			} else {
				setConversations((prev) =>
					sortConversations(
						prev.map((c) => (c.id === conversationId ? { ...c, title: data.title, updated_at: stamp } : c)),
					),
				);
			}
		} catch (err) {
			setMessages((prev) => prev.filter((m) => m.id !== tempId));
			setInput(content);
			setError(err instanceof Error ? err.message : "Failed to send message");
		} finally {
			sendingRef.current = false;
			setSending(false);
			setPendingQuestion("");
		}
	}

	async function handleSaveSuggestion(message: ChatMessage) {
		if (!message.suggested_memory) return;
		try {
			await request("/proposed-memories", {
				method: "POST",
				body: JSON.stringify({ content: message.suggested_memory, source: "ai-chat", confidence: 0.6 }),
			});
			setSavedSuggestions((prev) => new Set(prev).add(message.id));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save proposed memory");
		}
	}


	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function handleHistoryResizeStart(e: ReactPointerEvent<HTMLDivElement>) {
		e.preventDefault();
		const handle = e.currentTarget;
		const startX = e.clientX;
		const startWidth = historyWidth;
		resizingRef.current = true;
		handle.setPointerCapture(e.pointerId);
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";

		function onMove(ev: PointerEvent) {
			if (!resizingRef.current) return;
			const next = Math.min(520, Math.max(240, startWidth + (ev.clientX - startX)));
			setHistoryWidth(next);
		}

		function onUp(ev: PointerEvent) {
			resizingRef.current = false;
			try {
				handle.releasePointerCapture(ev.pointerId);
			} catch {
				// already released
			}
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			setHistoryWidth((w) => {
				try {
					localStorage.setItem("lumantic-chat-history-width", String(w));
				} catch {
					// ignore
				}
				return w;
			});
		}

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	}

	function renderPersonalRow(c: Conversation) {
		const active = c.id === activeId && scope === "personal";
		const unreadCount = Number(c.unread) || 0;
		return (
			<div
				key={c.id}
				className={`group relative flex items-center rounded-lg px-1 ${active ? "bg-violet-500/15" : "hover:bg-white/[0.03]"}`}
			>
				<button
					onClick={() => handleSelectConversation(c.id)}
					className={`min-w-0 flex-1 truncate px-2 py-2.5 pr-9 text-left text-sm sm:pr-2 sm:group-hover:pr-9 sm:group-focus-within:pr-9 ${active ? "text-violet-50" : unreadCount > 0 ? "font-semibold text-violet-100" : "text-violet-300/70"}`}
				>
					<span className="inline-flex max-w-full items-center gap-1.5">
						{!!c.pinned && <PinIcon className="size-3 shrink-0 text-violet-300/70" />}
						{!!c.archived && <ArchiveIcon className="size-3 shrink-0 text-violet-400/50" />}
						<Tooltip content={c.title}>
							<span className="truncate">{c.title}</span>
						</Tooltip>
						{unreadCount > 0 && !active && (
							<span
								aria-label={`${unreadCount} unread`}
								className="shrink-0 rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[11px] font-semibold text-violet-100"
							>
								{unreadCount}
							</span>
						)}
					</span>
				</button>
				<span className="absolute top-1/2 right-1 z-10 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
					<ChatOverflowMenu
						pinned={!!c.pinned}
						archived={!!c.archived}
						scope="personal"
						showMarkAllRead={hasAnyUnread}
						onAction={(action) => handlePersonalMenu(c.id, action)}
					/>
				</span>
			</div>
		);
	}


	function renderGlobalApiRow(c: Conversation) {
		const active = scope === "global" && activeGlobalApiId === c.id;
		const unreadCount = Number(c.unread) || 0;
		const authorName = c.author_name || "You";
		const authorIsYou = isGlobalAuthorYou(c, user?.name, user?.slackUsername);
		const authorInitials = authorName
			.split(" ")
			.map((p) => p[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase();
		return (
			<div
				key={`api-${c.id}`}
				className={`group relative rounded-lg px-1 ${active ? "bg-violet-500/15" : "hover:bg-white/[0.03]"}`}
			>
				<div className="min-w-0 px-2 py-2.5">
					<button
						type="button"
						onClick={() => handleSelectGlobalApi(c.id)}
						className="w-full min-w-0 pr-9 text-left sm:pr-0 sm:group-hover:pr-9 sm:group-focus-within:pr-9"
					>
						<span
							className={`flex min-w-0 items-center gap-1.5 text-sm ${active ? "text-violet-50" : unreadCount > 0 ? "font-semibold text-violet-100" : "text-violet-300/70"}`}
						>
							{!!c.pinned && <PinIcon className="size-3 shrink-0 text-violet-300/70" />}
							{!!c.archived && <ArchiveIcon className="size-3 shrink-0 text-violet-400/50" />}
							<Tooltip content={c.title}>
								<span className="min-w-0 flex-1 truncate">{c.title}</span>
							</Tooltip>
							{unreadCount > 0 && !active && (
								<span
									aria-label={`${unreadCount} unread`}
									className="shrink-0 rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[11px] font-semibold text-violet-100"
								>
									{unreadCount}
								</span>
							)}
						</span>
					</button>
					<span className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden">
						<span className="min-w-0 flex-1 overflow-hidden">
							<UserChip
								name={authorName}
								label={authorIsYou ? "you" : undefined}
								initialsText={authorInitials || "Y"}
								size="xs"
								muted
								trailing={
									<>
										{" · "}
										<RelativeTime label={formatRelative(c.created_at)} at={c.created_at} />
									</>
								}
							/>
						</span>
						<span className="shrink-0">
							<SourceBadge source={conversationSource(c)} compact />
						</span>
					</span>
				</div>
				<span className="absolute top-2 right-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
					<ChatOverflowMenu
						pinned={!!c.pinned}
						archived={!!c.archived}
						scope="global"
						showMarkAllRead={hasAnyUnread}
						onAction={(action) => handleGlobalApiMenu(c.id, action)}
					/>
				</span>
			</div>
		);
	}

	const historyPanel = (
		<div className="flex h-full flex-col bg-ink">
			<div className="space-y-3 p-3">
				<div className="grid grid-cols-2 gap-1 rounded-xl border border-violet-500/15 bg-white/[0.02] p-1 text-xs font-medium">
					<button
						onClick={() => switchScope("global")}
						className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
							scope === "global" ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
						}`}
					>
						<GlobeIcon className="size-3.5" />
						Global
					</button>
					<button
						onClick={() => switchScope("personal")}
						className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
							scope === "personal" ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
						}`}
					>
						<UserIcon className="size-3.5" />
						Personal
					</button>
				</div>
				<button
					onClick={handleNewChat}
					className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/25 px-3 py-2.5 text-sm font-medium text-violet-100 transition hover:border-violet-400/50 hover:bg-white/[0.03]"
				>
					<PlusIcon className="size-4" />
					New chat
				</button>
			</div>
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
					{scope === "personal" ? (
						loadingConversations ? (
							<div className="flex justify-center py-8">
								<SpinnerIcon className="size-4 text-violet-400" />
							</div>
						) : personalActive.length === 0 && personalArchived.length === 0 && personalTotal === 0 ? (
							<p className="px-2 py-4 text-center text-xs text-violet-400/40">No conversations yet</p>
						) : (
							<>
								{personalActive.map(renderPersonalRow)}
								{personalArchived.length > 0 && (
									<div className="pt-2">
										<button
											type="button"
											onClick={() => setShowArchived((v) => !v)}
											className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold tracking-wide text-violet-400/45 uppercase"
										>
											Archived ({personalArchived.length})
										</button>
										{showArchived && personalArchived.map(renderPersonalRow)}
									</div>
								)}
							</>
						)
					) : loadingConversations ? (
						<div className="flex justify-center py-8">
							<SpinnerIcon className="size-4 text-violet-400" />
						</div>
					) : (
						<>
							{globalApiActive.map(renderGlobalApiRow)}
							{globalApiActive.length === 0 && archivedCount === 0 && (
								<p className="px-2 py-4 text-center text-xs text-violet-400/40">No global chats yet</p>
							)}
							{archivedCount > 0 && (
								<div className="pt-2">
									<button
										type="button"
										onClick={() => setShowArchived((v) => !v)}
										className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold tracking-wide text-violet-400/45 uppercase"
									>
										Archived ({globalApiArchived.length})
									</button>
									{showArchived && globalApiArchived.map(renderGlobalApiRow)}
								</div>
							)}
						</>
					)}
				</div>
				{listTotal > CHAT_LIST_PAGE_SIZE && (
					<ListPagination
						page={listPage}
						pageSize={CHAT_LIST_PAGE_SIZE}
						total={listTotal}
						onPageChange={handleListPageChange}
						className="border-t border-violet-500/10 px-3 py-2 text-xs"
					/>
				)}
			</div>
			<div className="border-t border-violet-500/10 p-3">
				{scope === "global" ? (
					<DemoNote>Shared with your workspace. New chats here build memories the whole team can reuse.</DemoNote>
				) : (
					<DemoNote>
						Personal chats are never shared. Prefer Global when you can, so answers become shared team memory.
					</DemoNote>
				)}
			</div>
		</div>
	);

	const headerTitle =
		scope === "global"
			? draftNew
				? "New chat"
				: (activeGlobalApi?.title ?? "Global chats")
			: draftNew
				? "New chat"
				: (conversations.find((c) => c.id === activeId)?.title ?? "Chat with Lumantic");

	const headerSubtitle =
		scope === "global"
			? draftNew
				? "Shared with your workspace"
				: activeGlobalApi
					? `Asked by ${activeGlobalApi.author_name || "You"} · ${formatRelative(activeGlobalApi.created_at)}`
					: "Shared team chats that build reusable memories"
			: "Private to you. Prefer Global when answers should become shared memory.";

	const headerAuthor =
		scope === "global" && activeGlobalApi
			? {
					name: activeGlobalApi.author_name || user?.name || "You",
					label: isGlobalAuthorYou(activeGlobalApi, user?.name, user?.slackUsername) ? "you" : undefined,
					suffix: (
						<>
							{" · "}
							<RelativeTime
								label={formatRelative(activeGlobalApi.created_at)}
								at={activeGlobalApi.created_at}
							/>
						</>
					),
				}
			: null;

	const canCompose = scope === "personal" || activeGlobalApiId != null || draftNew;
	const canShare =
		!draftNew &&
		displayMessages.length > 0 &&
		((scope === "personal" && activeId != null) || (scope === "global" && activeGlobalApiId != null));

	return (
		<div className="flex h-full">
			{scopeConfirm && (
				<ScopeConfirmDialog
					mode={scopeConfirm.mode}
					busy={scopeBusy}
					onConfirm={confirmScopeChange}
					onClose={() => !scopeBusy && setScopeConfirm(null)}
				/>
			)}
			{shareTarget && <ShareChatModal target={shareTarget} onClose={() => setShareTarget(null)} />}

			<div className="relative hidden shrink-0 lg:block" style={{ width: historyWidth }}>
				<div className="h-full overflow-hidden border-r border-transparent">{historyPanel}</div>
				<div
					role="separator"
					aria-orientation="vertical"
					aria-label="Resize chat list"
					aria-valuenow={Math.round(historyWidth)}
					aria-valuemin={240}
					aria-valuemax={520}
					tabIndex={0}
					onPointerDown={handleHistoryResizeStart}
					onKeyDown={(e) => {
						if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
						e.preventDefault();
						setHistoryWidth((w) => {
							const next = e.key === "ArrowLeft" ? Math.max(240, w - 16) : Math.min(520, w + 16);
							try {
								localStorage.setItem("lumantic-chat-history-width", String(next));
							} catch {
								// ignore
							}
							return next;
						});
					}}
					className="group absolute inset-y-0 -right-1.5 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center"
				>
					<span className="h-full w-px bg-violet-500/20 transition group-hover:bg-violet-400/60 group-focus-visible:bg-violet-400/70 group-active:bg-violet-300/80" />
					<span className="pointer-events-none absolute h-10 w-1 rounded-full bg-violet-300/50 opacity-0 shadow-[0_0_12px_rgba(167,139,250,0.45)] transition group-hover:opacity-100 group-focus-visible:opacity-100" />
				</div>
			</div>

			{mobileHistoryOpen && (
				<div className="fixed inset-0 z-40 lg:hidden">
					<button
						aria-label="Close chat history"
						className="absolute inset-0 bg-black/60"
						onClick={() => setMobileHistoryOpen(false)}
					/>
					<div className="relative h-full w-60 shadow-2xl">{historyPanel}</div>
				</div>
			)}

			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex items-center gap-2 border-b border-violet-500/10 px-4 py-3 lg:px-6">
					<button
						onClick={() => setMobileHistoryOpen(true)}
						className="flex size-8 items-center justify-center rounded-lg text-violet-300/60 hover:bg-white/[0.05] lg:hidden"
						aria-label="Chat history"
					>
						<MenuIcon className="size-4" />
					</button>
					{scope === "global" ? (
						<GlobeIcon className="hidden size-4 text-violet-400/60 lg:block" />
					) : (
						<ChatIcon className="hidden size-4 text-violet-400/60 lg:block" />
					)}
					<div className="min-w-0 flex-1">
						<div className="flex min-w-0 items-center gap-2">
							<Tooltip content={headerTitle}>
								<h1 className="truncate font-display text-sm font-semibold text-violet-50">{headerTitle}</h1>
							</Tooltip>
							{!draftNew && headerTitle !== "Chat with Lumantic" && headerTitle !== "Global chats" && (
								<span className="shrink-0 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-violet-300/70">
									Lumantic generated title
								</span>
							)}
						</div>
						{headerAuthor ? (
							<div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-violet-400/50">
								<span className="shrink-0">Asked by</span>
								<UserChip
									name={headerAuthor.name}
									label={headerAuthor.label}
									size="xs"
									muted
									trailing={headerAuthor.suffix}
									className="min-w-0"
								/>
							</div>
						) : (
							<p className="truncate text-xs text-violet-400/50">{headerSubtitle}</p>
						)}
						{scope === "global" && activeGlobalApi && (
							<div className="mt-1.5 sm:hidden">
								<SourceBadge source={conversationSource(activeGlobalApi)} compact />
							</div>
						)}
					</div>
					{scope === "global" && activeGlobalApi && (
						<div className="hidden shrink-0 sm:block">
							<SourceBadge source={conversationSource(activeGlobalApi)} />
						</div>
					)}
					{canShare && (
						<button
							type="button"
							onClick={openShareForActive}
							aria-label="Share chat"
							className="flex size-8 shrink-0 items-center justify-center rounded-lg text-violet-300/60 transition hover:bg-white/[0.05] hover:text-violet-100"
						>
							<ShareIcon className="size-4" />
						</button>
					)}
				</div>

				{exampleDevBanner && (
					<div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-100/90 lg:px-6">
						Dev flag <span className="font-semibold">exampleDevBanner</span> is on. Toggle it from Cmd+K under Dev
						only.
					</div>
				)}

				<div
					ref={scrollRef}
					onScroll={handleMessageScroll}
					className="flex-1 space-y-5 overflow-y-auto px-4 py-5 lg:px-8"
				>
					{error && <ErrorBanner message={error} />}

					{(scope === "personal" || activeGlobalApiId != null) && loadingMessages ? (
						<div className="flex justify-center py-16">
							<SpinnerIcon className="size-5 text-violet-400" />
						</div>
					) : displayMessages.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
							<span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700">
								<SparkleIcon className="size-5 text-white" />
							</span>
							<div>
								<p className="font-medium text-violet-100">
									{scope === "global" && !draftNew && activeGlobalApiId == null
										? "No global chats yet"
										: "Ask Lumantic anything"}
							</p>
								<p className="mt-1 max-w-sm text-sm text-violet-300/50">
									{scope === "global" && !draftNew && activeGlobalApiId == null
										? "Once teammates ask Lumantic questions, resolved chats will show up here for the whole team."
										: scope === "global"
											? 'Try "How do we define active users?", "What counts toward churn?", or "Why did signups drop off last week?" Shared answers become team memory.'
											: 'Try "How do we define active users?", "What counts toward churn?", or "Why did signups drop off last week?" Answers are grounded in your team\'s memories.'}
								</p>
							</div>
						</div>
					) : (
						<>
							{(hasMoreMessages || loadingOlderMessages) && (scope === "personal" || activeGlobalApiId != null) && (
								<div className="flex items-center justify-center gap-2 py-1 text-xs text-violet-400/55">
									{loadingOlderMessages ? (
										<>
											<SpinnerIcon className="size-3.5" />
											Fetching later messages
										</>
									) : (
										<span>Scroll up for earlier messages</span>
									)}
								</div>
							)}
							{displayMessages.map((m) => (
								<MessageBubble
									key={m.id}
									message={m}
									authorName={messageAuthorName}
									authorIsYou={messageAuthorIsYou}
									animate={m.id === newestAssistantId}
									onSaveSuggestion={handleSaveSuggestion}
									savedSuggestion={savedSuggestions.has(m.id)}
									displayCurrency={displayCurrency}
									dateTimePrefs={dateTimePrefs}
								/>
							))}
						</>
					)}

					{canCompose && sending && (
						<div className="flex gap-3">
							<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-violet-700">
								<img src={logo} alt="" className="size-4 drop-shadow-[0_0_6px_rgba(184,148,255,0.5)]" />
							</span>
							<div className="flex w-full max-w-2xl flex-col gap-1.5">
								<span className="text-xs font-medium text-violet-100/90">Lumantic</span>
								<div className="w-full rounded-2xl border border-violet-500/15 bg-white/[0.03] px-4 py-2.5">
									<ThinkingBubble key={pendingQuestion} question={pendingQuestion} />
								</div>
							</div>
						</div>
					)}
				</div>

				{canCompose && (
					<div className="border-t border-violet-500/10 p-4 lg:px-8">
						<div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-violet-500/20 bg-white/[0.03] p-2 focus-within:border-violet-400/50">
							<textarea
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Message Lumantic…"
								rows={1}
								className="max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-violet-50 outline-none placeholder:text-violet-400/40"
							/>
							<button
								onClick={handleSend}
								disabled={!input.trim() || sending}
								className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
								aria-label="Send message"
							>
								<SendIcon className="size-4" />
							</button>
						</div>
						<p className="mt-2 text-center text-[11px] text-violet-400/40">
							{scope === "global"
								? "Global chats are shared with your workspace and help build team memory."
								: "Personal chats are never shared. Prefer Global when possible so answers become shared memories."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
