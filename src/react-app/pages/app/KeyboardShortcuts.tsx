import { useEffect, useState, type ReactNode } from "react";
import { Modal } from "./ui";

export const OPEN_SHORTCUTS_EVENT = "lumantic-open-shortcuts";

/** Max wait between G and the follow-up key. */
export const GO_PREFIX_MS = 1000;

export type NavShortcut = {
	id: string;
	label: string;
	/** Second key after G (lowercase). */
	key: string;
	path: string;
	adminOnly?: boolean;
};

/** G-then-letter navigation. Keys are shown uppercase in the modal. */
export const NAV_SHORTCUTS: readonly NavShortcut[] = [
	{ id: "personal", label: "Go to Personal chats", key: "p", path: "/app?scope=personal" },
	{ id: "global", label: "Go to Global chats", key: "g", path: "/app?scope=global" },
	{ id: "memories", label: "Go to Memories", key: "m", path: "/app/memories" },
	{ id: "proposed", label: "Go to Proposed memories", key: "r", path: "/app/proposed" },
	{ id: "team", label: "Go to Team", key: "t", path: "/app/team" },
	{ id: "billing", label: "Go to Billing", key: "b", path: "/app/billing" },
	{ id: "support", label: "Go to Support", key: "u", path: "/app/support" },
	{ id: "account", label: "Go to Account settings", key: "a", path: "/app/account" },
	{ id: "settings", label: "Go to Workspace settings", key: "s", path: "/app/settings", adminOnly: true },
];

export function isTypingTarget(target: EventTarget | null) {
	const el = target as HTMLElement | null;
	const tag = el?.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(el?.isContentEditable);
}

function isApplePlatform() {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent || "";
	const platform = navigator.platform || "";
	return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X/i.test(ua);
}

function Key({ children }: { children: ReactNode }) {
	return <kbd>{children}</kbd>;
}

function Chord({ keys, sequential = false }: { keys: string[]; sequential?: boolean }) {
	return (
		<span className="inline-flex items-center gap-1">
			{keys.map((key, i) => (
				<span key={`${key}-${i}`} className="inline-flex items-center gap-1">
					{i > 0 ? (
						<span className="text-[10px] text-violet-400/35">{sequential ? "then" : "+"}</span>
					) : null}
					<Key>{key}</Key>
				</span>
			))}
		</span>
	);
}

type ShortcutRow = {
	id: string;
	label: string;
	keys: string[];
	sequential?: boolean;
};

export function KeyboardShortcutsModal({
	open,
	onClose,
	canAccessSettings = false,
}: {
	open: boolean;
	onClose: () => void;
	canAccessSettings?: boolean;
}) {
	const [mod, setMod] = useState("Ctrl");

	useEffect(() => {
		setMod(isApplePlatform() ? "⌘" : "Ctrl");
	}, []);

	if (!open) return null;

	const globalRows: ShortcutRow[] = [
		{ id: "cmdk", label: "Open command menu", keys: [mod, "K"] },
		{ id: "help", label: "Keyboard shortcuts", keys: ["?"] },
		{ id: "esc", label: "Close dialog or menu", keys: ["Esc"] },
	];

	const navRows: ShortcutRow[] = NAV_SHORTCUTS.filter((s) => !s.adminOnly || canAccessSettings).map((s) => ({
		id: s.id,
		label: s.label,
		keys: ["G", s.key.toUpperCase()],
		sequential: true,
	}));

	return (
		<Modal title="Keyboard shortcuts" onClose={onClose} size="md">
			<ul className="space-y-1">
				{globalRows.map((row) => (
					<li
						key={row.id}
						className="flex items-center justify-between gap-4 rounded-xl px-1 py-2.5 text-sm text-violet-100/90"
					>
						<span>{row.label}</span>
						<Chord keys={row.keys} sequential={row.sequential} />
					</li>
				))}
			</ul>
			<p className="mt-4 mb-1 text-[11px] font-semibold tracking-wide text-violet-400/50 uppercase">Navigate</p>
			<ul className="space-y-1">
				{navRows.map((row) => (
					<li
						key={row.id}
						className="flex items-center justify-between gap-4 rounded-xl px-1 py-2.5 text-sm text-violet-100/90"
					>
						<span>{row.label}</span>
						<Chord keys={row.keys} sequential={row.sequential} />
					</li>
				))}
			</ul>
			<p className="mt-4 text-[11px] text-violet-400/45">
				Press <Key>G</Key> then a letter outside a text field. Press <Key>?</Key> to open this list.
			</p>
		</Modal>
	);
}
