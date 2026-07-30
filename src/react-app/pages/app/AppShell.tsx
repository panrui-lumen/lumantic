import { useState, type ReactNode } from "react";
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
	UsersIcon,
} from "../../components/Icons";
import { EditProfileModal } from "./EditProfileModal";
import { initials, Modal, Tooltip } from "./ui";
import type { AppUser } from "./types";
import type { AppRoute } from "./routes";

const PRIMARY_NAV: { route: AppRoute; label: string; icon: (className: string) => ReactNode }[] = [
	{ route: "chat", label: "Chat", icon: (c) => <ChatIcon className={c} /> },
	{ route: "memories", label: "Memories", icon: (c) => <BrainIcon className={c} /> },
];

const WORKSPACE_NAV: { route: AppRoute; label: string; icon: (className: string) => ReactNode }[] = [
	{ route: "team", label: "Team", icon: (c) => <UsersIcon className={c} /> },
	{ route: "billing", label: "Billing", icon: (c) => <CreditCardIcon className={c} /> },
	{ route: "support", label: "Support", icon: (c) => <LifeBuoyIcon className={c} /> },
	{ route: "settings", label: "Settings", icon: (c) => <GearIcon className={c} /> },
];

export function AppShell({
	route,
	onNavigate,
	proposedCount,
	openTicketCount,
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
	user: AppUser;
	onLogout: () => void;
	mobileNavOpen: boolean;
	onToggleMobileNav: () => void;
	children: ReactNode;
}) {
	const [showEditProfile, setShowEditProfile] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

	function renderNavItem(item: (typeof PRIMARY_NAV)[number] | (typeof WORKSPACE_NAV)[number]) {
		const active = item.route === "memories" ? route === "memories" || route === "proposed" : item.route === route;
		const supportBadge = item.route === "support" ? (openTicketCount ?? 0) : 0;
		const proposedBadge = item.route === "memories" ? proposedCount : 0;
		const proposedLabel = `${proposedBadge} proposed ${proposedBadge === 1 ? "memory" : "memories"}`;

		if (item.route === "memories") {
			return (
				<div
					key={item.route}
					className={`flex w-full items-center gap-1 rounded-lg pr-1.5 ${
						active ? "bg-violet-500/15 text-violet-50" : "text-violet-300/60 hover:bg-white/[0.03] hover:text-violet-100"
					}`}
				>
					<button
						type="button"
						onClick={() => onNavigate("memories")}
						className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium"
					>
						{item.icon(`size-4 shrink-0 ${active ? "text-violet-300" : "text-violet-400/50"}`)}
						<span className="flex-1">{item.label}</span>
					</button>
					{proposedBadge > 0 && (
						<Tooltip content={proposedLabel} side="right">
							<button
								type="button"
								aria-label={proposedLabel}
								onClick={() => onNavigate("proposed")}
								className="rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[11px] font-semibold text-violet-100 transition hover:bg-violet-500/40"
							>
								{proposedBadge}
							</button>
						</Tooltip>
					)}
				</div>
			);
		}

		return (
			<button
				key={item.route}
				type="button"
				onClick={() => onNavigate(item.route)}
				className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
					active ? "bg-violet-500/15 text-violet-50" : "text-violet-300/60 hover:bg-white/[0.03] hover:text-violet-100"
				}`}
			>
				{item.icon(`size-4 shrink-0 ${active ? "text-violet-300" : "text-violet-400/50"}`)}
				<span className="flex-1">{item.label}</span>
				{supportBadge > 0 && (
					<span className="rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[11px] font-semibold text-violet-100">{supportBadge}</span>
				)}
			</button>
		);
	}

	const sidebar = (
		<div className="flex h-full flex-col bg-ink">
			<div className="flex items-center gap-2.5 px-5 py-5">
				<img src={logo} alt="Lumantic" className="h-7 w-7 drop-shadow-[0_0_12px_rgba(184,148,255,0.6)]" />
				<div>
					<p className="font-display text-sm font-semibold tracking-tight text-violet-50">Lumantic</p>
					<p className="text-[11px] tracking-wide text-violet-400/50 uppercase">{user.company}</p>
				</div>
			</div>

			<nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-2">
				<div className="space-y-1">{PRIMARY_NAV.map(renderNavItem)}</div>
				<div className="mt-auto pt-6">
					<p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-violet-400/40 uppercase">Workspace</p>
					<div className="space-y-1">{WORKSPACE_NAV.map(renderNavItem)}</div>
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
							<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-xs font-semibold text-white">
								{initials(user.name)}
							</span>
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
					<img src={logo} alt="Lumantic" className="h-6 w-6" />
					<span className="font-display text-sm font-semibold text-violet-50">Lumantic</span>
				</header>

				<main className="min-h-0 flex-1 overflow-hidden">{children}</main>
			</div>
		</div>
	);
}
