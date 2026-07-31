import { useEffect, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
	AlertIcon,
	CheckIcon,
	ChevronLeft,
	ChevronRight,
	CloseIcon,
	LockIcon,
	SpinnerIcon,
	TrashIcon,
} from "../../components/Icons";
import {
	Tooltip as SharedTooltip,
	TooltipProvider as SharedTooltipProvider,
} from "../../components/Tooltip";
import { formatAppDateTime, resolveDateTimePrefs, DEFAULT_COMPANY_DATETIME } from "../../../shared/datetime";
import { useResolvedDateTimePrefs } from "./companySettings";

export function initials(name: string): string {
	return name
		.split(" ")
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function formatRelative(iso: string): string {
	const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
	const diffMs = Date.now() - date.getTime();
	const diffMin = Math.round(diffMs / 60000);
	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.round(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDay = Math.round(diffHr / 24);
	if (diffDay === 1) return "Yesterday";
	if (diffDay < 7) return `${diffDay}d ago`;
	return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatLongDate(input: string | number | Date): string {
	const prefs = resolveDateTimePrefs(DEFAULT_COMPANY_DATETIME);
	try {
		// Prefer live workspace prefs when rendered under the authenticated app.
		return formatAppDateTime(input, prefs, { dateStyle: "full", timeStyle: "short" });
	} catch {
		return "";
	}
}

export function RelativeTime({
	label,
	at,
	className = "",
}: {
	label: string;
	at: string | number | Date;
	className?: string;
}) {
	const prefs = useResolvedDateTimePrefs();
	const date =
		typeof at === "number" ? new Date(at) : at instanceof Date ? at : new Date(at.endsWith("Z") ? at : `${at}Z`);
	const long = Number.isNaN(date.getTime())
		? ""
		: formatAppDateTime(date, prefs, { dateStyle: "full", timeStyle: "short" });
	if (!long) return <span className={className}>{label}</span>;

	return (
		<Tooltip content={long}>
			<time dateTime={date.toISOString()} className={`cursor-default ${className}`}>
				{label}
			</time>
		</Tooltip>
	);
}

export function ListPagination({
	page,
	pageSize,
	total,
	onPageChange,
	className = "",
}: {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	className?: string;
}) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(Math.max(1, page), totalPages);
	if (total <= pageSize) return null;

	const rangeStart = (safePage - 1) * pageSize + 1;
	const rangeEnd = Math.min(safePage * pageSize, total);

	return (
		<div className={`flex items-center justify-between gap-3 text-sm text-violet-300/60 ${className}`}>
			<p>
				Showing {rangeStart}-{rangeEnd} of {total}
			</p>
			<div className="flex items-center gap-2">
				<span className="hidden text-xs sm:inline">
					Page {safePage} of {totalPages}
				</span>
				<button
					type="button"
					onClick={() => onPageChange(Math.max(1, safePage - 1))}
					disabled={safePage <= 1}
					aria-label="Previous page"
					className="flex size-9 items-center justify-center rounded-lg border border-violet-500/20 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<ChevronLeft className="size-4" />
				</button>
				<button
					type="button"
					onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
					disabled={safePage >= totalPages}
					aria-label="Next page"
					className="flex size-9 items-center justify-center rounded-lg border border-violet-500/20 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<ChevronRight className="size-4" />
				</button>
			</div>
		</div>
	);
}

export function TooltipProvider({ children }: { children: ReactNode }) {
	return <SharedTooltipProvider>{children}</SharedTooltipProvider>;
}

export function Tooltip({
	content,
	children,
	side = "top",
}: {
	content: ReactNode;
	children: ReactNode;
	side?: "top" | "bottom" | "left" | "right";
}) {
	return (
		<SharedTooltip content={content} side={side}>
			{children}
		</SharedTooltip>
	);
}

export const CATEGORY_STYLES: Record<string, string> = {
	general: "bg-violet-500/15 text-violet-200 border-violet-500/25",
	definition: "bg-sky-500/15 text-sky-200 border-sky-500/25",
	gotcha: "bg-rose-500/15 text-rose-200 border-rose-500/25",
	"business-rule": "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
	insight: "bg-amber-500/15 text-amber-200 border-amber-500/25",
};

export function CategoryPill({ category }: { category: string }) {
	const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.general;
	return (
		<span
			className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
		>
			{category}
		</span>
	);
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4 border-b border-violet-500/10 px-6 py-5">
			<div>
				<h1 className="font-display text-xl font-semibold text-violet-50">{title}</h1>
				<p className="mt-1 text-sm text-violet-300/60">{description}</p>
			</div>
			{action}
		</div>
	);
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-violet-500/20 px-6 py-16 text-center">
			<span className="flex size-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-300/70">
				{icon}
			</span>
			<div>
				<p className="font-medium text-violet-100">{title}</p>
				<p className="mt-1 max-w-sm text-sm text-violet-300/50">{description}</p>
			</div>
		</div>
	);
}

export function DemoNote({ children }: { children: ReactNode }) {
	return (
		<p className="flex items-center gap-1.5 text-[11px] text-violet-400/40">
			<LockIcon className="size-3 shrink-0" />
			{children}
		</p>
	);
}

const PILL_STYLES: Record<string, string> = {
	neutral: "bg-white/[0.05] text-violet-200 border-violet-500/20",
	violet: "bg-violet-500/15 text-violet-200 border-violet-500/25",
	emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
	amber: "bg-amber-500/15 text-amber-300 border-amber-500/25",
	rose: "bg-rose-500/15 text-rose-300 border-rose-500/25",
	sky: "bg-sky-500/15 text-sky-300 border-sky-500/25",
};

export function Pill({
	tone = "neutral",
	children,
	title,
}: {
	tone?: keyof typeof PILL_STYLES;
	children: ReactNode;
	title?: string;
}) {
	const pill = (
		<span
			className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${PILL_STYLES[tone]}`}
		>
			{children}
		</span>
	);
	if (!title) return pill;
	return <Tooltip content={title}>{pill}</Tooltip>;
}

export function Modal({
	title,
	onClose,
	children,
	size = "sm",
}: {
	title: string;
	onClose: () => void;
	children: ReactNode;
	size?: "sm" | "md" | "lg";
}) {
	const maxWidth = size === "lg" ? "max-w-2xl" : size === "md" ? "max-w-md" : "max-w-sm";
	return (
		<DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
				<DialogPrimitive.Content
					// Let a form's own autoFocus input keep focus instead of the dialog panel.
					onOpenAutoFocus={(e) => e.preventDefault()}
					className={`fixed top-1/2 left-1/2 z-50 flex max-h-[min(85vh,720px)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-violet-500/20 bg-ink p-6 shadow-[0_0_80px_-15px_rgba(143,99,248,0.4)] outline-none ${maxWidth}`}
				>
					<div className="mb-4 flex shrink-0 items-center justify-between gap-4">
						<DialogPrimitive.Title className="font-display text-base font-semibold text-violet-50">
							{title}
						</DialogPrimitive.Title>
						<DialogPrimitive.Close asChild>
							<button
								aria-label="Close"
								className="flex size-7 shrink-0 items-center justify-center rounded-lg text-violet-300/60 transition hover:bg-white/[0.05] hover:text-violet-100"
							>
								<CloseIcon className="size-4" />
							</button>
						</DialogPrimitive.Close>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

export function ErrorBanner({ message }: { message: string }) {
	return (
		<div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
			<AlertIcon className="size-4 shrink-0" />
			{message}
		</div>
	);
}

export function ConfirmDeleteButton({ onConfirm, label = "Delete" }: { onConfirm: () => void; label?: string }) {
	const [confirming, setConfirming] = useState(false);

	if (confirming) {
		return (
			<div className="flex items-center gap-1.5">
				<button
					onClick={() => {
						setConfirming(false);
						onConfirm();
					}}
					className="rounded-lg bg-rose-500/20 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30"
				>
					Confirm
				</button>
				<button
					onClick={() => setConfirming(false)}
					className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-300/60 transition hover:text-violet-100"
				>
					Cancel
				</button>
			</div>
		);
	}

	return (
		<Tooltip content={label}>
			<button
				onClick={() => setConfirming(true)}
				aria-label={label}
				className="flex size-8 items-center justify-center rounded-lg text-violet-300/60 transition hover:bg-rose-500/15 hover:text-rose-300"
			>
				<TrashIcon className="size-4" />
			</button>
		</Tooltip>
	);
}

export function Toggle({
	checked,
	onChange,
	disabled,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
				checked ? "bg-violet-500" : "bg-white/10"
			} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
		>
			<span
				className={`inline-block size-4.5 transform rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`}
			/>
		</button>
	);
}

export function SettingRow({
	title,
	description,
	control,
	status,
}: {
	title: string;
	description: ReactNode;
	control: ReactNode;
	/** Optional muted status (e.g. Saving… / Saved) shown left of the control. */
	status?: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4 py-3.5">
			<div className="min-w-0">
				<p className="text-sm font-medium text-violet-100">{title}</p>
				<div className="mt-0.5 text-xs text-violet-300/50">{description}</div>
			</div>
			<div className="flex shrink-0 items-center gap-2.5">
				{status}
				{control}
			</div>
		</div>
	);
}

export const selectClass =
	"cursor-pointer appearance-none rounded-lg border border-violet-500/20 bg-white/[0.03] py-2 pr-8 pl-3 text-sm text-violet-100 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed";

/** @deprecated Prefer `Select` from `../../components/Select` so the caret stays right-aligned. */
export { Select } from "../../components/Select";

export const inputClass =
	"w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50 outline-none transition placeholder:text-violet-400/40 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20";

export const textareaClass = `${inputClass} min-h-[84px] resize-y`;

/** Muted block with a moving highlight for content loading skeletons. */
export function Shimmer({ className = "" }: { className?: string }) {
	return (
		<div className={`relative overflow-hidden rounded-md bg-violet-500/10 ${className}`} aria-hidden>
			<div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-200/15 to-transparent [animation:shimmer_1.2s_infinite]" />
		</div>
	);
}

/** Spinner overlay that only appears after `delayMs` while `busy` stays true. */
export function DelayedBusyOverlay({
	busy,
	message,
	delayMs = 1000,
}: {
	busy: boolean;
	message: string;
	delayMs?: number;
}) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		if (!busy) {
			setShow(false);
			return;
		}
		const timer = window.setTimeout(() => setShow(true), delayMs);
		return () => window.clearTimeout(timer);
	}, [busy, delayMs]);

	if (!busy || !show) return null;

	return (
		<div
			className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 rounded-[inherit] bg-void/55 backdrop-blur-[1px]"
			role="status"
			aria-live="polite"
		>
			<SpinnerIcon className="size-5 text-violet-300" />
			<p className="text-sm font-medium text-violet-100/90">{message}</p>
		</div>
	);
}

export type GenerationPhaseId = "classify" | "context" | "plan" | "draft" | "review" | "post";

export const GENERATION_PHASES: {
	id: GenerationPhaseId;
	label: string;
	detail?: (question: string) => string | null;
}[] = [
	{
		id: "classify",
		label: "Classify question",
		detail: (question) => classifyQuestionKind(question),
	},
	{
		id: "context",
		label: "Check memory, Slack & Notion",
		detail: () => "Memories · Slack history · Notion pages",
	},
	{
		id: "plan",
		label: "Check data schema & plan query",
		detail: () => "Warehouse schema · query plan",
	},
	{
		id: "draft",
		label: "Get data & draft answer",
		detail: (question) =>
			/\b(chart|plot|trend|funnel|mix|over time|weekly|daily)\b/i.test(question)
				? "Fetching rows · plotting chart"
				: "Fetching rows · drafting prose",
	},
	{
		id: "review",
		label: "Review",
		detail: () => "Assumptions · connectors · confidence",
	},
	{
		id: "post",
		label: "Post",
		detail: () => "Sending reply",
	},
];

/** Time each phase stays active before advancing. */
export const GENERATION_PHASE_MS = 850;

/** Minimum wall time so every phase can play before the answer lands. */
export const GENERATION_MIN_MS = GENERATION_PHASES.length * GENERATION_PHASE_MS;

function classifyQuestionKind(question: string): string {
	const q = question.toLowerCase();
	if (
		/\b(prevent|root cause|why did|outage|incident|deep.?dive|investigate|how do we fix)\b/.test(q) ||
		q.length > 120
	) {
		return "Deep dive";
	}
	if (/\b(trend|over time|funnel|compare|cohort|breakdown|by plan|by source)\b/.test(q)) {
		return "Analysis";
	}
	if (/\b(define|what is|what'?s a|how long|timeout|include)\b/.test(q)) {
		return "Definition";
	}
	return "Ad hoc";
}

/** Build the completed generation pipeline for a question (stored on working). */
export function buildGenerationPipeline(question: string): { id: GenerationPhaseId; label: string; detail?: string }[] {
	return GENERATION_PHASES.map((phase) => {
		const detail = phase.detail?.(question) ?? undefined;
		return {
			id: phase.id,
			label: phase.label,
			...(detail ? { detail } : {}),
		};
	});
}

/** Chat assistant placeholder: sequential generation phases with spinner on the active step.
 * Remount with `key={question}` (or a send id) so the phase timeline restarts cleanly.
 * Renders as speech-bubble content (parent supplies the bubble chrome).
 */
export function ThinkingBubble({ question = "" }: { question?: string }) {
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		const timers = GENERATION_PHASES.slice(1).map((_, i) =>
			window.setTimeout(() => setActiveIndex(i + 1), (i + 1) * GENERATION_PHASE_MS),
		);
		return () => {
			for (const id of timers) window.clearTimeout(id);
		};
	}, []);

	const activeLabel = GENERATION_PHASES[Math.min(activeIndex, GENERATION_PHASES.length - 1)]?.label ?? "Thinking";

	return (
		<div role="status" aria-busy="true" aria-live="polite" className="w-full">
			<span className="sr-only">Generating reply: {activeLabel}</span>
			<p className="mb-2.5 text-sm leading-relaxed text-violet-100/90">
				Working through your question
				<span className="text-violet-400/50"> · </span>
				<span className="text-violet-300/70">
					{activeIndex + 1}/{GENERATION_PHASES.length}
				</span>
			</p>
			<ol className="space-y-1">
				{GENERATION_PHASES.map((phase, index) => {
					const done = index < activeIndex;
					const active = index === activeIndex;
					const detail = phase.detail?.(question) ?? null;
					return (
						<li
							key={phase.id}
							className={`flex items-start gap-2.5 rounded-lg px-1.5 py-1 transition-all duration-500 ${
								active ? "bg-violet-500/10" : ""
							}`}
						>
							<span
								className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
									done
										? "bg-emerald-500/20 text-emerald-300"
										: active
											? "text-violet-100"
											: "text-violet-400/35"
								}`}
							>
								{done ? (
									<CheckIcon className="size-3" />
								) : active ? (
									<SpinnerIcon className="size-3.5" />
								) : (
									<span className="size-1.5 rounded-full bg-current opacity-60" />
								)}
							</span>
							<span className="min-w-0 flex-1 pt-0.5">
								<span
									className={`block text-sm leading-snug ${
										active ? "font-medium text-violet-50" : done ? "text-violet-200/80" : "text-violet-400/45"
									}`}
								>
									{phase.label}
									{phase.id === "classify" && (active || done) && detail ? (
										<span className="ml-2 inline-flex rounded-full border border-violet-400/30 bg-violet-500/15 px-1.5 py-px text-[10px] font-semibold tracking-wide text-violet-100 uppercase">
											{detail}
										</span>
									) : null}
								</span>
								{active && detail && phase.id !== "classify" ? (
									<span className="mt-0.5 block text-[11px] text-violet-300/55">{detail}</span>
								) : null}
								{active && phase.id === "classify" && detail ? (
									<span className="mt-0.5 block text-[11px] text-violet-300/55">
										Classified as <span className="font-medium text-violet-200/80">{detail}</span>
									</span>
								) : null}
							</span>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

