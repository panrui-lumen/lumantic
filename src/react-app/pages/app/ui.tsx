import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AlertIcon, CloseIcon, LockIcon, TrashIcon } from "../../components/Icons";

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

export function TooltipProvider({ children }: { children: ReactNode }) {
	return (
		<TooltipPrimitive.Provider delayDuration={250} skipDelayDuration={100}>
			{children}
		</TooltipPrimitive.Provider>
	);
}

export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
	return (
		<TooltipPrimitive.Root>
			<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
			<TooltipPrimitive.Portal>
				<TooltipPrimitive.Content
					side={side}
					sideOffset={6}
					className="z-50 rounded-lg border border-violet-500/25 bg-ink px-2.5 py-1.5 text-xs font-medium text-violet-100 shadow-lg data-[state=delayed-open]:animate-rise"
				>
					{content}
					<TooltipPrimitive.Arrow className="fill-violet-500/25" />
				</TooltipPrimitive.Content>
			</TooltipPrimitive.Portal>
		</TooltipPrimitive.Root>
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
	return <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>{category}</span>;
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
			<span className="flex size-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-300/70">{icon}</span>
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

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof PILL_STYLES; children: ReactNode }) {
	return (
		<span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${PILL_STYLES[tone]}`}>
			{children}
		</span>
	);
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
	return (
		<DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
				<DialogPrimitive.Content
					// Let a form's own autoFocus input keep focus instead of the dialog panel.
					onOpenAutoFocus={(e) => e.preventDefault()}
					className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-violet-500/20 bg-ink p-6 shadow-[0_0_80px_-15px_rgba(143,99,248,0.4)] outline-none"
				>
					<div className="mb-4 flex items-center justify-between gap-4">
						<DialogPrimitive.Title className="font-display text-base font-semibold text-violet-50">{title}</DialogPrimitive.Title>
						<DialogPrimitive.Close asChild>
							<button
								aria-label="Close"
								className="flex size-7 shrink-0 items-center justify-center rounded-lg text-violet-300/60 transition hover:bg-white/[0.05] hover:text-violet-100"
							>
								<CloseIcon className="size-4" />
							</button>
						</DialogPrimitive.Close>
					</div>
					{children}
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

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
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

export function SettingRow({ title, description, control }: { title: string; description: string; control: ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 py-3.5">
			<div>
				<p className="text-sm font-medium text-violet-100">{title}</p>
				<p className="mt-0.5 text-xs text-violet-300/50">{description}</p>
			</div>
			{control}
		</div>
	);
}

export const selectClass =
	"appearance-none rounded-lg border border-violet-500/20 bg-white/[0.03] py-2 pr-8 pl-3 text-sm text-violet-100 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20";

export const inputClass =
	"w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50 outline-none transition placeholder:text-violet-400/40 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20";

export const textareaClass = `${inputClass} min-h-[84px] resize-y`;
