import { useEffect, useRef, useState, type ReactNode } from "react";
import {
	ArchiveIcon,
	CheckIcon,
	GlobeIcon,
	LockIcon,
	MoreHorizontalIcon,
	PinIcon,
	ShareIcon,
	TrashIcon,
	UserIcon,
} from "../../components/Icons";
import { Modal } from "./ui";

export type ChatMenuAction =
	| "pin"
	| "unpin"
	| "archive"
	| "unarchive"
	| "make-global"
	| "make-private"
	| "delete"
	| "share"
	| "mark-all-read";

export function ChatOverflowMenu({
	pinned,
	archived,
	scope,
	showMarkAllRead,
	onAction,
}: {
	pinned: boolean;
	archived: boolean;
	scope: "personal" | "global";
	showMarkAllRead?: boolean;
	onAction: (action: ChatMenuAction) => void;
}) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onDoc(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);

	const items: { action: ChatMenuAction; label: string; icon: ReactNode; tone?: "rose" }[] = [
		{
			action: "share",
			label: "Share",
			icon: <ShareIcon className="size-3.5" />,
		},
		...(showMarkAllRead
			? [
					{
						action: "mark-all-read" as const,
						label: "Mark all as read",
						icon: <CheckIcon className="size-3.5" />,
					},
				]
			: []),
		{
			action: pinned ? "unpin" : "pin",
			label: pinned ? "Unpin" : "Pin",
			icon: <PinIcon className="size-3.5" />,
		},
		{
			action: archived ? "unarchive" : "archive",
			label: archived ? "Unarchive" : "Archive",
			icon: <ArchiveIcon className="size-3.5" />,
		},
		scope === "personal"
			? {
					action: "make-global" as const,
					label: "Make global",
					icon: <GlobeIcon className="size-3.5" />,
				}
			: {
					action: "make-private" as const,
					label: "Make private",
					icon: <UserIcon className="size-3.5" />,
				},
		...(scope === "personal"
			? [
					{
						action: "delete" as const,
						label: "Delete",
						icon: <TrashIcon className="size-3.5" />,
						tone: "rose" as const,
					},
				]
			: []),
	];

	return (
		<div ref={rootRef} className="relative shrink-0">
			<button
				type="button"
				aria-label="Chat options"
				aria-expanded={open}
				onClick={(e) => {
					e.stopPropagation();
					setOpen((v) => !v);
				}}
				className="flex size-7 items-center justify-center rounded-lg text-violet-400/50 transition hover:bg-white/[0.06] hover:text-violet-100"
			>
				<MoreHorizontalIcon className="size-4" />
			</button>
			{open && (
				<div
					role="menu"
					className="absolute top-8 right-0 z-50 min-w-[11rem] rounded-xl border border-violet-500/20 bg-ink py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]"
				>
					{items.map((item) => (
						<button
							key={item.action}
							type="button"
							role="menuitem"
							onClick={(e) => {
								e.stopPropagation();
								setOpen(false);
								onAction(item.action);
							}}
							className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-white/[0.05] ${
								item.tone === "rose" ? "text-rose-300" : "text-violet-100"
							}`}
						>
							{item.icon}
							{item.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function ScopeConfirmDialog({
	mode,
	busy,
	onConfirm,
	onClose,
}: {
	mode: "make-global" | "make-private";
	busy?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}) {
	const makingGlobal = mode === "make-global";

	return (
		<Modal title={makingGlobal ? "Make this chat global?" : "Make this chat private?"} onClose={onClose}>
			<div className="space-y-4">
				<div className="flex items-start gap-3 rounded-xl border border-violet-500/15 bg-white/[0.03] p-3">
					<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
						{makingGlobal ? <GlobeIcon className="size-4" /> : <LockIcon className="size-4" />}
					</span>
					<div className="space-y-2 text-sm leading-relaxed text-violet-200/80">
						{makingGlobal ? (
							<>
								<p>
									This conversation will leave your personal list and appear in{" "}
									<strong className="font-semibold text-violet-50">Global</strong> for everyone on the Beacon team.
								</p>
								<p>
									Teammates can read the full thread. Prefer Global when the answer should become shared team memory.
								</p>
								<p className="text-violet-300/60">Personal chats are never shared. Once global, this one will be.</p>
							</>
						) : (
							<>
								<p>
									This conversation will leave <strong className="font-semibold text-violet-50">Global</strong> and move
									to your personal chats.
								</p>
								<p>Teammates will no longer see it in the shared feed. Personal chats are never shared.</p>
								<p className="text-violet-300/60">Ask in Global again later if the team should reuse the answer.</p>
							</>
						)}
					</div>
				</div>
				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						disabled={busy}
						className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:text-violet-100 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={busy}
						className="rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{busy ? "Working…" : makingGlobal ? "Make global" : "Make private"}
					</button>
				</div>
			</div>
		</Modal>
	);
}
