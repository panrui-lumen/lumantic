import { useEffect, useState, type ReactNode } from "react";
import logo from "../../assets/lumantic-logo.png";
import {
	BrainIcon,
	ChatIcon,
	CreditCardIcon,
	GearIcon,
	LifeBuoyIcon,
	LogOutIcon,
	MenuIcon,
	PencilIcon,
	SearchIcon,
	UsersIcon,
} from "../../components/Icons";
import { EDIT_PROFILE_EVENT, LOGOUT_CONFIRM_EVENT, OPEN_CMDK_EVENT } from "./CommandPalette";
import { EditProfileModal } from "./EditProfileModal";
import { UserProfileHost } from "./UserProfileModal";
import { UserAvatar } from "./UserAvatar";
import { Modal, Tooltip } from "./ui";
import type { AppUser } from "./types";
import type { AppRoute } from "./routes";
import { canAccessSettings } from "../../../shared/access";

const PRIMARY_NAV: { route: AppRoute; label: string; icon: (className: string) => ReactNode }[] = [
	{ route: "chat", label: "Chat", icon: (c) => <ChatIcon className={c} /> },
	{ route: "memories", label: "Memories", icon: (c) => <BrainIcon className={c} /> },
];

const WORKSPACE_NAV: { route: AppRoute; label: string; icon: (className: string) => ReactNode; adminOnly?: boolean }[] =
	[
		{ route: "team", label: "Team", icon: (c) => <UsersIcon className={c} /> },
		{ route: "billing", label: "Billing", icon: (c) => <CreditCardIcon className={c} /> },
		{ route: "support", label: "Support", icon: (c) => <LifeBuoyIcon className={c} /> },
		{ route: "settings", label: "Settings", icon: (c) => <GearIcon className={c} />, adminOnly: true },
	];

export function AppShell({
	route,
	onNavigate,
	proposedCount,
	openTicketCount,
	unreadChatCount = 0,
	user,
	onLogout,
	mobileNavOpen,
	onToggleMobileNav,
	children,
}: {
	route: AppRoute;
	onNavigate: (route: AppRoute) => void;
	proposedCount: number;
	openTicketCount?: number;
	unreadChatCount?: number;
	user: AppUser;
	onLogout: () => void;
	mobileNavOpen: boolean;
	onToggleMobileNav: () => void;
	children: ReactNode;
}) {
	const [showEditProfile, setShowEditProfile] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const [modKey, setModKey] = useState("Ctrl");

	useEffect(() => {
		const onEdit = () => setShowEditProfile(true);
		const onLogout = () => setShowLogoutConfirm(true);
		window.addEventListener(EDIT_PROFILE_EVENT, onEdit);
		window.addEventListener(LOGOUT_CONFIRM_EVENT, onLogout);
		const apple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || "") || /Mac OS X/i.test(navigator.userAgent || "");
		setModKey(apple ? "⌘" : "Ctrl");
		return () => {
			window.removeEventListener(EDIT_PROFILE_EVENT, onEdit);
			window.removeEventListener(LOGOUT_CONFIRM_EVENT, onLogout);
		};
	}, []);

	function openCommandPalette() {
		window.dispatchEvent(new Event(OPEN_CMDK_EVENT));
	}

	function renderNavItem(item: (typeof PRIMARY_NAV)[number] | (typeof WORKSPACE_NAV)[number]) {
		const active = item.route === "memories" ? route === "memories" || route === "proposed" : item.route === route;
		const supportBadge = item.route === "support" ? (openTicketCount ?? 0) : 0;
		const proposedBadge = item.route === "memories" ? proposedCount : 0;
		const chatBadge = item.route === "chat" ? unreadChatCount : 0;
		const proposedLabel = `${proposedBadge} proposed ${proposedBadge === 1 ? "memory" : "memories"}`;
		const chatLabel = `${chatBadge} unread ${chatBadge === 1 ? "chat" : "chats"}`;
		const rowClass = `flex w-full items-center gap-2 rounded-lg pl-3 pr-2 ${
			active ? "bg-violet-500/15 text-violet-50" : "text-violet-300/60 hover:bg-white/[0.03] hover:text-violet-100"
		}`;
		const labelClass = "flex min-w-0 flex-1 items-center gap-2.5 py-2.5 text-left text-sm font-medium";
		const badgeSlotClass = "flex w-7 shrink-0 items-center justify-end";
		const badgeClass = "rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-100";

		if (item.route === "memories") {
			return (
				<div key={item.route} className={rowClass}>
					<button type="button" onClick={() => onNavigate("memories")} className={labelClass}>
						{item.icon(`size-4 shrink-0 ${active ? "text-violet-300" : "text-violet-400/50"}`)}
						<span className="min-w-0 flex-1 truncate">{item.label}</span>
					</button>
					<div className={badgeSlotClass}>
						{proposedBadge > 0 && (
							<Tooltip content={proposedLabel} side="right">
								<button
									type="button"
									aria-label={proposedLabel}
									onClick={() => onNavigate("proposed")}
									className={`${badgeClass} transition hover:bg-violet-500/40`}
								>
									{proposedBadge}
								</button>
							</Tooltip>
						)}
					</div>
				</div>
			);
		}

		return (
			<button
				key={item.route}
				type="button"
				onClick={() => onNavigate(item.route)}
				className={`${rowClass} text-left transition`}
			>
				<span className={labelClass}>
					{item.icon(`size-4 shrink-0 ${active ? "text-violet-300" : "text-violet-400/50"}`)}
					<span className="min-w-0 flex-1 truncate">{item.label}</span>
				</span>
				<span className={badgeSlotClass}>
					{chatBadge > 0 && (
						<Tooltip content={chatLabel} side="right">
							<span aria-label={chatLabel} className={badgeClass}>
								{chatBadge}
							</span>
						</Tooltip>
					)}
					{supportBadge > 0 && <span className={badgeClass}>{supportBadge}</span>}
				</span>
			</button>
		);
	}

	const sidebar = (
		<div className="flex h-full flex-col bg-ink">
			<a
				href="/app"
				onClick={(e) => {
					e.preventDefault();
					onNavigate("chat");
				}}
				className="flex items-center gap-2.5 px-5 py-5 transition hover:opacity-90"
				aria-label="Lumantic home"
			>
				<img src={logo} alt="" className="h-7 w-7 drop-shadow-[0_0_12px_rgba(184,148,255,0.6)]" />
				<div>
					<p className="font-display text-sm font-semibold tracking-tight text-violet-50">Lumantic</p>
					<p className="text-[11px] tracking-wide text-violet-400/50 uppercase">{user.company}</p>
				</div>
			</a>

			<div className="px-3 pb-3">
				<button
					type="button"
					onClick={openCommandPalette}
					className="flex w-full items-center gap-2.5 rounded-lg border border-violet-500/15 bg-white/[0.02] px-3 py-2 text-left text-sm text-violet-300/70 transition hover:border-violet-500/25 hover:bg-white/[0.04] hover:text-violet-100"
				>
					<SearchIcon className="size-4 shrink-0 text-violet-400/50" />
					<span className="flex-1">Search</span>
					<span className="inline-flex items-center gap-0.5">
						<kbd>{modKey}</kbd>
						<kbd>K</kbd>
					</span>
				</button>
			</div>

			<nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-2">
				<div className="space-y-1">{PRIMARY_NAV.map(renderNavItem)}</div>
				<div className="mt-auto pt-6">
					<p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-violet-400/40 uppercase">Workspace</p>
					<div className="space-y-1">
						{WORKSPACE_NAV.filter((item) => !item.adminOnly || canAccessSettings(user.workspaceRole)).map(
							renderNavItem,
						)}
					</div>
				</div>
			</nav>

			<div className="border-t border-violet-500/10 p-3">
				<div className="flex items-center gap-1 rounded-lg p-1">
					<Tooltip content="Edit name & role">
						<button
							type="button"
							onClick={() => setShowEditProfile(true)}
							aria-label="Edit profile"
							className="group flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-white/[0.05]"
						>
							<UserAvatar name={user.name} avatarUrl={user.avatarUrl} sizeClass="size-8" textClass="text-xs" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-violet-50">{user.name}</p>
								<p className="truncate text-xs text-violet-400/50">{user.role}</p>
							</div>
							<PencilIcon className="size-3.5 shrink-0 text-violet-400/40 transition group-hover:text-violet-200" />
						</button>
					</Tooltip>
					<Tooltip content="Log out">
						<button
							type="button"
							onClick={() => setShowLogoutConfirm(true)}
							aria-label="Log out"
							className="flex size-8 shrink-0 items-center justify-center rounded-lg text-violet-300/60 transition hover:bg-white/[0.05] hover:text-violet-100"
						>
							<LogOutIcon className="size-4" />
						</button>
					</Tooltip>
				</div>
			</div>
		</div>
	);

	return (
		<div className="flex h-screen overflow-hidden bg-void text-violet-50">
			{showEditProfile && <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} />}
			<UserProfileHost />
			{showLogoutConfirm && (
				<Modal title="Log out?" onClose={() => setShowLogoutConfirm(false)}>
					<div className="space-y-4">
						<p className="text-sm leading-relaxed text-violet-200/80">
							You will need to sign in again to access the {user.company} workspace.
						</p>
						<div className="flex items-center justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowLogoutConfirm(false)}
								className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:text-violet-100"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									setShowLogoutConfirm(false);
									onLogout();
								}}
								className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30"
							>
								Log out
							</button>
						</div>
					</div>
				</Modal>
			)}

			<aside className="hidden w-64 shrink-0 border-r border-violet-500/10 md:block">{sidebar}</aside>

			{mobileNavOpen && (
				<div className="fixed inset-0 z-40 md:hidden">
					<button aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={onToggleMobileNav} />
					<div className="relative h-full w-64 border-r border-violet-500/10 shadow-2xl">{sidebar}</div>
				</div>
			)}

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex items-center gap-3 border-b border-violet-500/10 px-4 py-3 md:hidden">
					<Tooltip content="Open menu">
						<button
							onClick={onToggleMobileNav}
							aria-label="Open menu"
							className="flex size-9 items-center justify-center rounded-lg text-violet-300/70 hover:bg-white/[0.05]"
						>
							<MenuIcon className="size-5" />
						</button>
					</Tooltip>
					<a
						href="/app"
						onClick={(e) => {
							e.preventDefault();
							onNavigate("chat");
						}}
						className="flex min-w-0 flex-1 items-center gap-2 transition hover:opacity-90"
						aria-label="Lumantic home"
					>
						<img src={logo} alt="" className="h-6 w-6" />
						<span className="font-display text-sm font-semibold text-violet-50">Lumantic</span>
					</a>
					<Tooltip content="Search">
						<button
							type="button"
							onClick={openCommandPalette}
							aria-label="Open search"
							className="flex size-9 items-center justify-center rounded-lg text-violet-300/70 hover:bg-white/[0.05]"
						>
							<SearchIcon className="size-5" />
						</button>
					</Tooltip>
				</header>

				<main className="min-h-0 flex-1 overflow-hidden">{children}</main>
			</div>
		</div>
	);
}
