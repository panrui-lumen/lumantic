import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
	beaconCrashesExplanation,
	beaconCrashesSandboxExplanation,
	beaconCrashesSandboxWorking,
	beaconCrashesSignalsFollowupExplanation,
	beaconCrashesSignalsFollowupWorking,
	beaconCrashesTable,
	beaconCrashesWorking,
	beaconLongestSessions,
	beaconLongestSessionsExplanation,
	beaconLongestSessionsWorking,
	beaconScoreFilterExplanation,
	beaconScoreFilterWorking,
	beaconSessionEventsExplanation,
	beaconSessionEventsWorking,
	beaconSessionsMedianExplanation,
	beaconSessionsMedianWorking,
	beaconSessionsPlanExplanation,
	beaconSessionsPlanWorking,
	beaconSignupsChart,
	beaconSignupsExplanation,
	beaconSignupsLostExplanation,
	beaconSignupsLostWorking,
	beaconSignupsSourcesExplanation,
	beaconSignupsSourcesWorking,
	beaconSignupsWorking,
	memoryLookupWorking,
	parseChatArtifact,
	parseChatWorking,
	type ChatWorking,
} from "../../../shared/beacon-analytics";
import {
	ArchiveIcon,
	ChatIcon,
	ChevronDown,
	ChevronUpIcon,
	GlobeIcon,
	MenuIcon,
	PinIcon,
	PlusIcon,
	SendIcon,
	SlackIcon,
	SparkleIcon,
	SpinnerIcon,
	UserIcon,
} from "../../components/Icons";
import { ChatArtifactView } from "./ChatArtifactView";
import { ChatOverflowMenu, ScopeConfirmDialog, type ChatMenuAction } from "./ChatMenu";
import { useAppAuth } from "./context";
import { DemoNote, ErrorBanner, Pill } from "./ui";
import type { ChatMessage, Conversation } from "./types";

type ChatScope = "personal" | "global";

type GlobalSource =
	| { kind: "app" }
	| { kind: "slack"; channel: string };

type GlobalConversation = {
	id: string;
	title: string;
	author: { name: string; initials: string };
	askedAt: string;
	source: GlobalSource;
	messages: ChatMessage[];
	pinned?: boolean;
	archived?: boolean;
};

type ScopeConfirm =
	| { mode: "make-global"; kind: "personal"; id: number }
	| { mode: "make-private"; kind: "fixture"; id: string }
	| { mode: "make-private"; kind: "api"; id: number };

function sortConversations(list: Conversation[]) {
	return [...list].sort((a, b) => {
		const ap = a.pinned ? 1 : 0;
		const bp = b.pinned ? 1 : 0;
		if (ap !== bp) return bp - ap;
		return (b.updated_at || "").localeCompare(a.updated_at || "");
	});
}

function sortFixtures(list: GlobalConversation[]) {
	return [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
}

function SourceBadge({ source, compact = false }: { source: GlobalSource; compact?: boolean }) {
	if (source.kind === "slack") {
		return (
			<Pill tone="sky">
				<SlackIcon className={compact ? "size-3" : "size-3.5"} />
				{compact ? `#${source.channel}` : `Asked in Slack · #${source.channel}`}
			</Pill>
		);
	}
	return (
		<Pill tone="violet">
			<ChatIcon className={compact ? "size-3" : "size-3.5"} />
			{compact ? "In app" : "Asked in app"}
		</Pill>
	);
}

const GLOBAL_CONVERSATIONS: GlobalConversation[] = [
	{
		id: "g1",
		title: "Why did signups drop off in March?",
		author: { name: "Priya Nair", initials: "PN" },
		askedAt: "2h ago",
		source: { kind: "slack", channel: "data-team" },
		messages: [
			{ id: -101, role: "user", content: "Why did signups drop off in March?", suggested_memory: null, created_at: "" },
			{
				id: -102,
				role: "assistant",
				content: beaconSignupsExplanation(),
				suggested_memory: null,
				artifact: JSON.stringify(beaconSignupsChart()),
				working: JSON.stringify(beaconSignupsWorking()),
				created_at: "",
			},
			{ id: -201, role: "user", content: "How many signups did we lose during the outage?", suggested_memory: null, created_at: "" },
			{
				id: -202,
				role: "assistant",
				content: beaconSignupsLostExplanation(),
				suggested_memory: null,
				working: JSON.stringify(beaconSignupsLostWorking()),
				created_at: "",
			},
			{ id: -203, role: "user", content: "Which signup sources recovered first after the fix?", suggested_memory: null, created_at: "" },
			{
				id: -204,
				role: "assistant",
				content: beaconSignupsSourcesExplanation(),
				suggested_memory: null,
				working: JSON.stringify(beaconSignupsSourcesWorking()),
				created_at: "",
			},
		],
	},
	{
		id: "g2",
		title: "Top 10 users with the longest sessions",
		author: { name: "Sam Rivera", initials: "SR" },
		askedAt: "Yesterday",
		source: { kind: "app" },
		messages: [
			{ id: -103, role: "user", content: "Give me top 10 users with the longest sessions", suggested_memory: null, created_at: "" },
			{
				id: -104,
				role: "assistant",
				content: beaconLongestSessionsExplanation(),
				suggested_memory: null,
				artifact: JSON.stringify(beaconLongestSessions()),
				working: JSON.stringify(beaconLongestSessionsWorking()),
				created_at: "",
			},
			{ id: -205, role: "user", content: "What's the median session length for comparison?", suggested_memory: null, created_at: "" },
			{
				id: -206,
				role: "assistant",
				content: beaconSessionsMedianExplanation(),
				suggested_memory: null,
				working: JSON.stringify(beaconSessionsMedianWorking()),
				created_at: "",
			},
			{ id: -207, role: "user", content: "Are any of these on Enterprise, or are they internal dogfood?", suggested_memory: null, created_at: "" },
			{
				id: -208,
				role: "assistant",
				content: beaconSessionsPlanExplanation(),
				suggested_memory: null,
				working: JSON.stringify(beaconSessionsPlanWorking()),
				created_at: "",
			},
		],
	},
	{
		id: "g3",
		title: "Which users experienced crashes?",
		author: { name: "Jordan Lee", initials: "JL" },
		askedAt: "2 days ago",
		source: { kind: "slack", channel: "data-alerts" },
		messages: [
			{
				id: -105,
				role: "user",
				content: "Which users experienced crashes, and what page were they on?",
				suggested_memory: null,
				created_at: "",
			},
			{
				id: -106,
				role: "assistant",
				content: beaconCrashesExplanation(),
				suggested_memory: null,
				artifact: JSON.stringify(beaconCrashesTable()),
				working: JSON.stringify(beaconCrashesWorking()),
				created_at: "",
			},
			{ id: -209, role: "user", content: "Is /dashboard/signals still the top crash page?", suggested_memory: null, created_at: "" },
			{
				id: -210,
				role: "assistant",
				content: beaconCrashesSignalsFollowupExplanation(),
				suggested_memory: null,
				working: JSON.stringify(beaconCrashesSignalsFollowupWorking()),
				created_at: "",
			},
			{ id: -211, role: "user", content: "How many of these crashes were on sandbox orgs?", suggested_memory: null, created_at: "" },
			{
				id: -212,
				role: "assistant",
				content: beaconCrashesSandboxExplanation(),
				suggested_memory: null,
				working: JSON.stringify(beaconCrashesSandboxWorking()),
				created_at: "",
			},
		],
	},
	{
		id: "g4",
		title: "Does the Beacon Score include sandbox orgs?",
		author: { name: "Priya Nair", initials: "PN" },
		askedAt: "3 days ago",
		source: { kind: "slack", channel: "exec-metrics" },
		messages: [
			{ id: -107, role: "user", content: "Our Beacon Score jumped overnight. Are sandbox orgs in that number?", suggested_memory: null, created_at: "" },
			{
				id: -108,
				role: "assistant",
				content:
					"No. **Beacon Score** always excludes orgs tagged `env = sandbox` and the internal `beacon-dogfood` workspace. If those filters drop, Score can inflate by ~3-5%.",
				suggested_memory: null,
				working: JSON.stringify(
					memoryLookupWorking(
						"Beacon Score always excludes orgs tagged env = sandbox and the internal beacon-dogfood workspace.",
					),
				),
				created_at: "",
			},
			{ id: -213, role: "user", content: "Where is that sandbox filter enforced?", suggested_memory: null, created_at: "" },
			{
				id: -214,
				role: "assistant",
				content: beaconScoreFilterExplanation(),
				suggested_memory: null,
				working: JSON.stringify(beaconScoreFilterWorking()),
				created_at: "",
			},
		],
	},
	{
		id: "g5",
		title: "What's a Beacon session timeout?",
		author: { name: "Sam Rivera", initials: "SR" },
		askedAt: "4 days ago",
		source: { kind: "app" },
		messages: [
			{ id: -109, role: "user", content: "How long until a Beacon session ends from idle?", suggested_memory: null, created_at: "" },
			{
				id: -110,
				role: "assistant",
				content:
					"A Beacon **session** ends after **30 minutes of idle** with no client events. Background tabs that only emit heartbeats do **not** keep the session alive. Heartbeats aren't Beacon signals.",
				suggested_memory: null,
				working: JSON.stringify(
					memoryLookupWorking(
						"A Beacon session ends after 30 minutes of idle with no client events. Heartbeats do not keep the session alive.",
					),
				),
				created_at: "",
			},
			{ id: -215, role: "user", content: "What counts as a client event, and does mobile use the same timeout?", suggested_memory: null, created_at: "" },
			{
				id: -216,
				role: "assistant",
				content: beaconSessionEventsExplanation(),
				suggested_memory: null,
				working: JSON.stringify(beaconSessionEventsWorking()),
				created_at: "",
			},
		],
	},
];

function renderInline(text: string) {
	const parts = text.split(/(\*\*[^*]+\*\*)/g);
	return parts.map((part, i) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return (
				<strong key={i} className="font-semibold text-violet-50">
					{part.slice(2, -2)}
				</strong>
			);
		}
		return <span key={i}>{part}</span>;
	});
}

function MessageContent({ content }: { content: string }) {
	const lines = content.split("\n").filter((l) => l.trim() !== "");
	return (
		<div className="space-y-2">
			{lines.map((line, i) =>
				line.startsWith("> ") ? (
					<div key={i} className="border-l-2 border-violet-400/40 bg-white/[0.03] py-1.5 pl-3 text-[13px] text-violet-200/90 italic">
						{renderInline(line.slice(2))}
					</div>
				) : (
					<p key={i} className="text-sm leading-relaxed text-violet-100">
						{renderInline(line)}
					</p>
				),
			)}
		</div>
	);
}

function TypingDots() {
	return (
		<div className="flex items-center gap-1 px-1 py-1">
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					className="size-1.5 animate-bounce rounded-full bg-violet-300/70"
					style={{ animationDelay: `${i * 0.15}s` }}
				/>
			))}
		</div>
	);
}

const EMPTY_WORKING: ChatWorking = {
	sql: [],
	assumptions: ["Working details were not stored for this reply."],
};

function ShowYourWorking({ working }: { working: ChatWorking | null }) {
	const [open, setOpen] = useState(false);
	const data = working ?? EMPTY_WORKING;

	return (
		<div className="w-full min-w-0">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-white/[0.02] px-2.5 py-1.5 text-xs font-medium text-violet-300/90 transition hover:border-violet-400/40 hover:text-violet-100"
			>
				{open ? <ChevronUpIcon className="size-3" /> : <ChevronDown className="size-3" />}
				{open ? "Hide your working" : "Show your working"}
			</button>
			{open && (
				<div className="mt-2 space-y-3 rounded-xl border border-violet-500/15 bg-black/25 px-3 py-3">
					<section>
						<p className="mb-1.5 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">SQL</p>
						{data.sql.length === 0 ? (
							<p className="text-xs text-violet-400/55">No warehouse query for this reply.</p>
						) : (
							<div className="space-y-2">
								{data.sql.map((q, i) => (
									<pre
										key={i}
										className="overflow-x-auto rounded-lg border border-violet-500/10 bg-violet-950/40 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-violet-100/90"
									>
										{q}
									</pre>
								))}
							</div>
						)}
					</section>
					<section>
						<p className="mb-1.5 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">Assumptions</p>
						<ul className="space-y-1.5">
							{data.assumptions.map((a, i) => (
								<li key={i} className="flex gap-2 text-xs leading-relaxed text-violet-200/85">
									<span className="mt-1.5 size-1 shrink-0 rounded-full bg-violet-400/50" />
									<span>{a}</span>
								</li>
							))}
						</ul>
					</section>
					{data.notes && data.notes.length > 0 && (
						<section>
							<p className="mb-1.5 text-[11px] font-semibold tracking-wide text-violet-300/70 uppercase">Notes</p>
							<ul className="space-y-1.5">
								{data.notes.map((n, i) => (
									<li key={i} className="flex gap-2 text-xs leading-relaxed text-violet-200/75">
										<span className="mt-1.5 size-1 shrink-0 rounded-full bg-violet-400/35" />
										<span>{n}</span>
									</li>
								))}
							</ul>
						</section>
					)}
				</div>
			)}
		</div>
	);
}

function MessageBubble({
	message,
	animate,
	onSaveSuggestion,
	savedSuggestion,
}: {
	message: ChatMessage;
	animate: boolean;
	onSaveSuggestion: (message: ChatMessage) => void;
	savedSuggestion: boolean;
}) {
	const isUser = message.role === "user";
	const artifact = !isUser ? parseChatArtifact(message.artifact) : null;
	const working = !isUser ? parseChatWorking(message.working) : null;
	return (
		<div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} ${animate ? "animate-rise" : ""}`}>
			<span
				className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
					isUser ? "bg-white/10 text-violet-200" : "bg-gradient-to-br from-violet-500 to-violet-700 text-white"
				}`}
			>
				{isUser ? <UserIcon className="size-3.5" /> : <SparkleIcon className="size-3.5" />}
			</span>
			<div className={`flex flex-col gap-1.5 ${isUser ? "max-w-[75%] items-end" : "w-full max-w-2xl items-start"}`}>
				<div
					className={`rounded-2xl px-4 py-2.5 ${
						isUser ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white" : "w-full border border-violet-500/15 bg-white/[0.03]"
					}`}
				>
					{isUser ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p> : <MessageContent content={message.content} />}
				</div>
				{artifact && (
					<div className="w-full min-w-0">
						<ChatArtifactView artifact={artifact} />
					</div>
				)}
				{!isUser && <ShowYourWorking working={working} />}
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

export function ChatPage() {
	const { request } = useAppAuth();
	const [scope, setScope] = useState<ChatScope>("global");
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [globalApiConversations, setGlobalApiConversations] = useState<Conversation[]>([]);
	const [fixtures, setFixtures] = useState<GlobalConversation[]>(() => GLOBAL_CONVERSATIONS.map((c) => ({ ...c })));
	const [activeId, setActiveId] = useState<number | null>(null);
	const [activeGlobalId, setActiveGlobalId] = useState<string | null>(GLOBAL_CONVERSATIONS[0]?.id ?? null);
	const [activeGlobalApiId, setActiveGlobalApiId] = useState<number | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [loadingConversations, setLoadingConversations] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [error, setError] = useState("");
	const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
	const [savedSuggestions, setSavedSuggestions] = useState<Set<number>>(new Set());
	const [newestAssistantId, setNewestAssistantId] = useState<number | null>(null);
	const [scopeConfirm, setScopeConfirm] = useState<ScopeConfirm | null>(null);
	const [scopeBusy, setScopeBusy] = useState(false);
	const [showArchived, setShowArchived] = useState(false);
	const [draftNew, setDraftNew] = useState(false);
	const [historyWidth, setHistoryWidth] = useState(() => {
		try {
			const saved = Number(localStorage.getItem("lumantic-chat-history-width"));
			if (Number.isFinite(saved) && saved >= 180 && saved <= 480) return saved;
		} catch {
			// ignore
		}
		return 240;
	});
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const resizingRef = useRef(false);
	const sendingRef = useRef(false);

	const activeFixture = fixtures.find((c) => c.id === activeGlobalId) ?? null;
	const activeGlobalApi = globalApiConversations.find((c) => c.id === activeGlobalApiId) ?? null;
	const displayMessages =
		scope === "global" ? (activeGlobalApiId != null ? messages : (activeFixture?.messages ?? [])) : messages;

	const personalActive = conversations.filter((c) => !c.archived);
	const personalArchived = conversations.filter((c) => !!c.archived);
	const fixtureActive = sortFixtures(fixtures.filter((c) => !c.archived));
	const fixtureArchived = sortFixtures(fixtures.filter((c) => !!c.archived));
	const globalApiActive = globalApiConversations.filter((c) => !c.archived);
	const globalApiArchived = globalApiConversations.filter((c) => !!c.archived);
	const archivedCount =
		scope === "personal" ? personalArchived.length : fixtureArchived.length + globalApiArchived.length;

	const loadConversations = useCallback(
		async (listScope: ChatScope = "personal") => {
			const data = await request<{ conversations: Conversation[] }>(`/conversations?scope=${listScope}`);
			const sorted = sortConversations(data.conversations);
			if (listScope === "global") setGlobalApiConversations(sorted);
			else setConversations(sorted);
			return sorted;
		},
		[request],
	);

	const loadMessages = useCallback(
		async (id: number) => {
			setLoadingMessages(true);
			try {
				const data = await request<{ messages: ChatMessage[] }>(`/conversations/${id}/messages`);
				setMessages(data.messages);
			} finally {
				setLoadingMessages(false);
			}
		},
		[request],
	);

	useEffect(() => {
		Promise.all([loadConversations("global"), loadConversations("personal")])
			.catch((err) => setError(err instanceof Error ? err.message : "Failed to load chats"))
			.finally(() => setLoadingConversations(false));
	}, [loadConversations]);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
	}, [messages, activeGlobalId, activeGlobalApiId, scope, sending]);

	async function switchScope(next: ChatScope) {
		setScope(next);
		setShowArchived(false);
		setDraftNew(false);
		setError("");
		if (next === "global") {
			setActiveGlobalApiId(null);
			try {
				await loadConversations("global");
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load global chats");
			}
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
		setActiveGlobalId(null);
		setActiveGlobalApiId(id);
		setMobileHistoryOpen(false);
		setNewestAssistantId(null);
		await loadMessages(id);
	}

	function handleSelectFixture(id: string) {
		setDraftNew(false);
		setActiveGlobalApiId(null);
		setActiveGlobalId(id);
		setMobileHistoryOpen(false);
		setNewestAssistantId(null);
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
		if (activeId === id) {
			const next = remaining.find((c) => !c.archived) ?? remaining[0];
			if (next) {
				setActiveId(next.id);
				loadMessages(next.id);
			} else {
				setActiveId(null);
				setMessages([]);
			}
		}
		try {
			await request(`/conversations/${id}`, { method: "DELETE" });
		} catch {
			// local removal already applied
		}
	}

	async function handlePersonalMenu(id: number, action: ChatMenuAction) {
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
			setConversations((prev) => sortConversations(prev.map((c) => (c.id === id ? { ...c, ...conversation } : c))));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update chat");
		}
	}

	async function handleGlobalApiMenu(id: number, action: ChatMenuAction) {
		if (action === "make-private") {
			setScopeConfirm({ mode: "make-private", kind: "api", id });
			return;
		}
		try {
			const conversation = await patchConversation(id, {
				...(action === "pin" ? { pinned: true } : {}),
				...(action === "unpin" ? { pinned: false } : {}),
				...(action === "archive" ? { archived: true } : {}),
				...(action === "unarchive" ? { archived: false } : {}),
			});
			setGlobalApiConversations((prev) => sortConversations(prev.map((c) => (c.id === id ? { ...c, ...conversation } : c))));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update chat");
		}
	}

	function handleFixtureMenu(id: string, action: ChatMenuAction) {
		if (action === "make-private") {
			setScopeConfirm({ mode: "make-private", kind: "fixture", id });
			return;
		}
		setFixtures((prev) =>
			sortFixtures(
				prev.map((c) => {
					if (c.id !== id) return c;
					if (action === "pin") return { ...c, pinned: true };
					if (action === "unpin") return { ...c, pinned: false };
					if (action === "archive") return { ...c, archived: true };
					if (action === "unarchive") return { ...c, archived: false };
					return c;
				}),
			),
		);
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
			} else if (scopeConfirm.mode === "make-private" && scopeConfirm.kind === "fixture") {
				const fixture = fixtures.find((c) => c.id === scopeConfirm.id);
				if (!fixture) return;
				const data = await request<{ conversation: Conversation }>("/conversations/import", {
					method: "POST",
					body: JSON.stringify({
						title: fixture.title,
						scope: "personal",
						messages: fixture.messages.map((m) => ({
							role: m.role,
							content: m.content,
							suggested_memory: m.suggested_memory,
							artifact: m.artifact ?? null,
							working: m.working ?? null,
						})),
					}),
				});
				const remaining = fixtures.filter((c) => c.id !== scopeConfirm.id);
				setFixtures(remaining);
				setConversations((prev) => sortConversations([data.conversation, ...prev]));
				setScope("personal");
				setActiveGlobalId(remaining[0]?.id ?? null);
				await handleSelectConversation(data.conversation.id);
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
		setInput("");
		setMobileHistoryOpen(false);
		setNewestAssistantId(null);
		if (scope === "global") {
			setActiveGlobalApiId(null);
			setActiveGlobalId(null);
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
		setSending(true);
		sendingRef.current = true;

		const tempId = -Date.now();
		setMessages((prev) => [...prev, { id: tempId, role: "user", content, suggested_memory: null, created_at: new Date().toISOString() }]);

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
					setActiveGlobalId(null);
					setGlobalApiConversations((prev) => [created.conversation, ...prev.filter((c) => c.id !== conversationId)]);
				} else {
					setActiveId(conversationId);
					setConversations((prev) => [created.conversation, ...prev.filter((c) => c.id !== conversationId)]);
				}
			}
			setDraftNew(false);

			const data = await request<{ userMessage: ChatMessage; assistantMessage: ChatMessage; title: string }>(
				`/conversations/${conversationId}/messages`,
				{ method: "POST", body: JSON.stringify({ content }) },
			);

			setMessages((prev) => [...prev.filter((m) => m.id !== tempId), data.userMessage, data.assistantMessage]);
			setNewestAssistantId(data.assistantMessage.id);
			const stamp = new Date().toISOString();
			if (scope === "global") {
				setGlobalApiConversations((prev) =>
					sortConversations(prev.map((c) => (c.id === conversationId ? { ...c, title: data.title, updated_at: stamp } : c))),
				);
			} else {
				setConversations((prev) =>
					sortConversations(prev.map((c) => (c.id === conversationId ? { ...c, title: data.title, updated_at: stamp } : c))),
				);
			}
		} catch (err) {
			setMessages((prev) => prev.filter((m) => m.id !== tempId));
			setInput(content);
			setError(err instanceof Error ? err.message : "Failed to send message");
		} finally {
			sendingRef.current = false;
			setSending(false);
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

	async function handleAskYourself() {
		const sourceMessages =
			activeGlobalApiId != null ? messages : (activeFixture?.messages ?? []);
		const title = activeGlobalApi?.title ?? activeFixture?.title ?? "Imported chat";
		if (sourceMessages.length === 0) return;

		setError("");
		try {
			const data = await request<{ conversation: Conversation }>("/conversations/import", {
				method: "POST",
				body: JSON.stringify({
					title,
					scope: "personal",
					messages: sourceMessages.map((m) => ({
						role: m.role,
						content: m.content,
						suggested_memory: m.suggested_memory,
						artifact: m.artifact ?? null,
						working: m.working ?? null,
					})),
				}),
			});
			setConversations((prev) => sortConversations([data.conversation, ...prev.filter((c) => c.id !== data.conversation.id)]));
			setScope("personal");
			setDraftNew(false);
			setActiveId(data.conversation.id);
			setActiveGlobalApiId(null);
			setMobileHistoryOpen(false);
			setNewestAssistantId(null);
			await loadMessages(data.conversation.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to open this chat in Personal");
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
			const next = Math.min(480, Math.max(180, startWidth + (ev.clientX - startX)));
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
		return (
			<div key={c.id} className={`group flex items-center gap-1 rounded-lg px-1 ${active ? "bg-violet-500/15" : "hover:bg-white/[0.03]"}`}>
				<button
					onClick={() => handleSelectConversation(c.id)}
					className={`min-w-0 flex-1 truncate px-2 py-2.5 text-left text-sm ${active ? "text-violet-50" : "text-violet-300/70"}`}
					title={c.title}
				>
					<span className="inline-flex max-w-full items-center gap-1.5">
						{!!c.pinned && <PinIcon className="size-3 shrink-0 text-violet-300/70" />}
						{!!c.archived && <ArchiveIcon className="size-3 shrink-0 text-violet-400/50" />}
						<span className="truncate">{c.title}</span>
					</span>
				</button>
				<span className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
					<ChatOverflowMenu pinned={!!c.pinned} archived={!!c.archived} scope="personal" onAction={(action) => handlePersonalMenu(c.id, action)} />
				</span>
			</div>
		);
	}

	function renderFixtureRow(c: GlobalConversation) {
		const active = scope === "global" && activeGlobalApiId == null && c.id === activeGlobalId;
		return (
			<div key={c.id} className={`group flex items-start gap-1 rounded-lg px-1 ${active ? "bg-violet-500/15" : "hover:bg-white/[0.03]"}`}>
				<button onClick={() => handleSelectFixture(c.id)} className="min-w-0 flex-1 px-2 py-2.5 text-left">
					<span className={`flex items-center gap-1.5 truncate text-sm ${active ? "text-violet-50" : "text-violet-300/70"}`} title={c.title}>
						{c.pinned && <PinIcon className="size-3 shrink-0 text-violet-300/70" />}
						{c.archived && <ArchiveIcon className="size-3 shrink-0 text-violet-400/50" />}
						<span className="truncate">{c.title}</span>
					</span>
					<span className="mt-1.5 flex flex-wrap items-center gap-1.5">
						<SourceBadge source={c.source} compact />
						<span className="flex min-w-0 items-center gap-1.5 text-[11px] text-violet-400/45">
							<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-violet-200">
								{c.author.initials}
							</span>
							<span className="truncate">
								{c.author.name} · {c.askedAt}
							</span>
						</span>
					</span>
				</button>
				<span className="mt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
					<ChatOverflowMenu pinned={!!c.pinned} archived={!!c.archived} scope="global" onAction={(action) => handleFixtureMenu(c.id, action)} />
				</span>
			</div>
		);
	}

	function renderGlobalApiRow(c: Conversation) {
		const active = scope === "global" && activeGlobalApiId === c.id;
		const initials = (c.author_name || "You")
			.split(" ")
			.map((p) => p[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase();
		return (
			<div key={`api-${c.id}`} className={`group flex items-start gap-1 rounded-lg px-1 ${active ? "bg-violet-500/15" : "hover:bg-white/[0.03]"}`}>
				<button onClick={() => handleSelectGlobalApi(c.id)} className="min-w-0 flex-1 px-2 py-2.5 text-left">
					<span className={`flex items-center gap-1.5 truncate text-sm ${active ? "text-violet-50" : "text-violet-300/70"}`} title={c.title}>
						{!!c.pinned && <PinIcon className="size-3 shrink-0 text-violet-300/70" />}
						{!!c.archived && <ArchiveIcon className="size-3 shrink-0 text-violet-400/50" />}
						<span className="truncate">{c.title}</span>
					</span>
					<span className="mt-1.5 flex flex-wrap items-center gap-1.5">
						<SourceBadge source={{ kind: "app" }} compact />
						<span className="flex min-w-0 items-center gap-1.5 text-[11px] text-violet-400/45">
							<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-violet-200">
								{initials || "Y"}
							</span>
							<span className="truncate">{c.author_name || "You"} · Shared</span>
						</span>
					</span>
				</button>
				<span className="mt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
					<ChatOverflowMenu pinned={!!c.pinned} archived={!!c.archived} scope="global" onAction={(action) => handleGlobalApiMenu(c.id, action)} />
				</span>
			</div>
		);
	}

	const historyPanel = (
		<div className="flex h-full flex-col bg-ink">
			<div className="space-y-3 p-3">
				<div className="grid grid-cols-2 gap-1 rounded-xl border border-violet-500/15 bg-white/[0.02] p-1 text-xs font-medium">
					<button
						onClick={() => switchScope("personal")}
						className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
							scope === "personal" ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
						}`}
					>
						<UserIcon className="size-3.5" />
						Personal
					</button>
					<button
						onClick={() => switchScope("global")}
						className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
							scope === "global" ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
						}`}
					>
						<GlobeIcon className="size-3.5" />
						Global
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
			<div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
				{scope === "personal" ? (
					loadingConversations ? (
						<div className="flex justify-center py-8">
							<SpinnerIcon className="size-4 text-violet-400" />
						</div>
					) : personalActive.length === 0 && personalArchived.length === 0 ? (
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
				) : (
					<>
						{globalApiActive.map(renderGlobalApiRow)}
						{fixtureActive.map(renderFixtureRow)}
						{fixtureActive.length + globalApiActive.length === 0 && archivedCount === 0 && (
							<p className="px-2 py-4 text-center text-xs text-violet-400/40">No global chats yet</p>
						)}
						{archivedCount > 0 && (
							<div className="pt-2">
								<button
									type="button"
									onClick={() => setShowArchived((v) => !v)}
									className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold tracking-wide text-violet-400/45 uppercase"
								>
									Archived ({fixtureArchived.length + globalApiArchived.length})
								</button>
								{showArchived && (
									<>
										{globalApiArchived.map(renderGlobalApiRow)}
										{fixtureArchived.map(renderFixtureRow)}
									</>
								)}
							</div>
						)}
					</>
				)}
			</div>
			<div className="border-t border-violet-500/10 p-3">
				{scope === "global" ? (
					<DemoNote>Shared with your workspace. New chats here build memories the whole team can reuse.</DemoNote>
				) : (
					<DemoNote>Personal chats are never shared. Prefer Global when you can, so answers become shared team memory.</DemoNote>
				)}
			</div>
		</div>
	);

	const headerTitle =
		scope === "global"
			? draftNew
				? "New chat"
				: activeGlobalApi?.title ?? activeFixture?.title ?? "Global chats"
			: draftNew
				? "New chat"
				: conversations.find((c) => c.id === activeId)?.title ?? "Chat with Lumantic";

	const headerSubtitle =
		scope === "global"
			? draftNew
				? "Shared with your workspace"
				: activeGlobalApi
					? `Asked by ${activeGlobalApi.author_name || "You"} · Shared`
					: activeFixture
						? `Asked by ${activeFixture.author.name} · ${activeFixture.askedAt}`
						: "Shared team chats that build reusable memories"
			: "Private to you. Prefer Global when answers should become shared memory.";

	const canCompose = scope === "personal" || activeGlobalApiId != null || draftNew;

	return (
		<div className="flex h-full">
			{scopeConfirm && (
				<ScopeConfirmDialog mode={scopeConfirm.mode} busy={scopeBusy} onConfirm={confirmScopeChange} onClose={() => !scopeBusy && setScopeConfirm(null)} />
			)}

			<div className="relative hidden shrink-0 lg:block" style={{ width: historyWidth }}>
				<div className="h-full overflow-hidden border-r border-transparent">{historyPanel}</div>
				<div
					role="separator"
					aria-orientation="vertical"
					aria-label="Resize chat list"
					aria-valuenow={Math.round(historyWidth)}
					aria-valuemin={180}
					aria-valuemax={480}
					tabIndex={0}
					onPointerDown={handleHistoryResizeStart}
					onKeyDown={(e) => {
						if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
						e.preventDefault();
						setHistoryWidth((w) => {
							const next = e.key === "ArrowLeft" ? Math.max(180, w - 16) : Math.min(480, w + 16);
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
					<button aria-label="Close chat history" className="absolute inset-0 bg-black/60" onClick={() => setMobileHistoryOpen(false)} />
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
					{scope === "global" ? <GlobeIcon className="hidden size-4 text-violet-400/60 lg:block" /> : <ChatIcon className="hidden size-4 text-violet-400/60 lg:block" />}
					<div className="min-w-0 flex-1">
						<h1 className="truncate font-display text-sm font-semibold text-violet-50">{headerTitle}</h1>
						<p className="truncate text-xs text-violet-400/50">{headerSubtitle}</p>
						{scope === "global" && activeFixture && (
							<div className="mt-1.5 sm:hidden">
								<SourceBadge source={activeFixture.source} compact />
							</div>
						)}
						{scope === "global" && activeGlobalApi && (
							<div className="mt-1.5 sm:hidden">
								<SourceBadge source={{ kind: "app" }} compact />
							</div>
						)}
					</div>
					{scope === "global" && activeFixture && (
						<div className="hidden shrink-0 sm:block">
							<SourceBadge source={activeFixture.source} />
						</div>
					)}
					{scope === "global" && activeGlobalApi && (
						<div className="hidden shrink-0 sm:block">
							<SourceBadge source={{ kind: "app" }} />
						</div>
					)}
				</div>

				<div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-5 lg:px-8">
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
									{scope === "global" && !draftNew && activeGlobalApiId == null && !activeFixture
										? "No global chats yet"
										: "Ask the Lumantic AI anything"}
								</p>
								<p className="mt-1 max-w-sm text-sm text-violet-300/50">
									{scope === "global" && !draftNew && activeGlobalApiId == null && !activeFixture
										? "Once teammates ask the AI questions, resolved chats will show up here for the whole team."
										: scope === "global"
											? 'Try "How do we define active users?" or "What counts toward churn?" Shared answers become team memory.'
											: 'Try "How do we define active users?" or "What counts toward churn?" Answers are grounded in your team\'s memories.'}
								</p>
							</div>
						</div>
					) : (
						displayMessages.map((m) => (
							<MessageBubble
								key={m.id}
								message={m}
								animate={m.id === newestAssistantId}
								onSaveSuggestion={handleSaveSuggestion}
								savedSuggestion={savedSuggestions.has(m.id)}
							/>
						))
					)}

					{canCompose && sending && (
						<div className="flex gap-3">
							<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white">
								<SparkleIcon className="size-3.5" />
							</span>
							<div className="rounded-2xl border border-violet-500/15 bg-white/[0.03] px-3 py-2">
								<TypingDots />
							</div>
						</div>
					)}
				</div>

				{!canCompose ? (
					<div className="border-t border-violet-500/10 p-4 lg:px-8">
						<div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/15 bg-white/[0.02] px-4 py-3">
							<p className="flex items-center gap-1.5 text-xs text-violet-400/50">
								<GlobeIcon className="size-3.5 shrink-0" />
								Example chats are read-only. Start a new chat to ask the team AI.
							</p>
							<button
								onClick={handleAskYourself}
								disabled={!activeFixture && !activeGlobalApi}
								className="rounded-lg border border-violet-500/25 px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:border-violet-400/50 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Ask this myself
							</button>
						</div>
					</div>
				) : (
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
