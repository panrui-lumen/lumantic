import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import logo from "../../assets/lumantic-logo.png";
import {
	AlertIcon,
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
import { useAppAuth } from "./context";
import { useT } from "./i18n";
import { UserProfileHost } from "./UserProfileModal";
import { UserAvatar } from "./UserAvatar";
import { Modal, Tooltip } from "./ui";
import type { AppUser } from "./types";
import type { AppRoute } from "./routes";
import { canAccessSettings } from "../../../shared/access";
import { OverPlanBanner } from "./OverPlanBanner";

const PRIMARY_NAV: { route: AppRoute; labelKey: string; icon: (className: string) => ReactNode }[] = [
	{ route: "chat", labelKey: "nav.chat", icon: (c) => <ChatIcon className={c} /> },
	{ route: "memories", labelKey: "nav.memories", icon: (c) => <BrainIcon className={c} /> },
];

const WORKSPACE_NAV: {
	route: AppRoute;
	labelKey: string;
	icon: (className: string) => ReactNode;
	adminOnly?: boolean;
}[] = [
	{ route: "team", labelKey: "nav.team", icon: (c) => <UsersIcon className={c} /> },
	{ route: "billing", labelKey: "nav.billing", icon: (c) => <CreditCardIcon className={c} /> },
	{ route: "support", labelKey: "nav.support", icon: (c) => <LifeBuoyIcon className={c} /> },
	{ route: "settings", labelKey: "nav.settings", icon: (c) => <GearIcon className={c} />, adminOnly: true },
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
	const t = useT();
	const { request } = useAppAuth();
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const [modKey, setModKey] = useState("Ctrl");

	const { data: billingSummary } = useQuery({
		queryKey: ["billing-over-plan"],
		queryFn: () => request<{ overdue?: boolean }>("/billing"),
		staleTime: 60_000,
	});
	const billingOverdue = Boolean(billingSummary?.overdue);

	useEffect(() => {
		const onEdit = () => onNavigate("account");
		const onLogout = () => setShowLogoutConfirm(true);
		window.addEventListener(EDIT_PROFILE_EVENT, onEdit);
		window.addEventListener(LOGOUT_CONFIRM_EVENT, onLogout);
		const apple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || "") || /Mac OS X/i.test(navigator.userAgent || "");
		setModKey(apple ? "⌘" : "Ctrl");
		return () => {
			window.removeEventListener(EDIT_PROFILE_EVENT, onEdit);
			window.removeEventListener(LOGOUT_CONFIRM_EVENT, onLogout);
		};
	}, [onNavigate]);

	function openCommandPalette() {
		window.dispatchEvent(new Event(OPEN_CMDK_EVENT));
	}

	function renderNavItem(item: (typeof PRIMARY_NAV)[number] | (typeof WORKSPACE_NAV)[number]) {
		const active = item.route === "memories" ? route === "memories" || route === "proposed" : item.route === route;
		const supportBadge = item.route === "support" ? (openTicketCount ?? 0) : 0;
		const proposedBadge = item.route === "memories" ? proposedCount : 0;
		const chatBadge = item.route === "chat" ? unreadChatCount : 0;
		const billingWarning = item.route === "billing" && billingOverdue;
		const proposedLabel = t("nav.proposedMemories", { count: proposedBadge });
		const chatLabel = t("nav.unreadChats", { count: chatBadge });
		const billingOverdueLabel = t("nav.billingOverdue");
		const label = t(item.labelKey);
		const rowClass = `flex w-full items-center gap-2 rounded-lg pl-3 pr-2 ${
			active ? "bg-violet-500/15 text-violet-50" : "text-violet-300/60 hover:bg-white/[0.03] hover:text-violet-100"
		}`;
		const labelClass =
			"flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-2.5 text-left text-sm font-medium";
		const badgeSlotClass = "flex w-7 shrink-0 items-center justify-end";
		const badgeClass = "rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-100";

		if (item.route === "memories") {
			return (
				<div key={item.route} className={rowClass}>
					<button type="button" onClick={() => onNavigate("memories")} className={labelClass}>
						{item.icon(`size-4 shrink-0 ${active ? "text-violet-300" : "text-violet-400/50"}`)}
						<span className="min-w-0 flex-1 truncate">{label}</span>
					</button>
					<div className={badgeSlotClass}>
						{proposedBadge > 0 && (
							<Tooltip content={proposedLabel} side="right">
								<button
									type="button"
									aria-label={proposedLabel}
									onClick={() => onNavigate("proposed")}
									className={`${badgeClass} cursor-pointer transition hover:bg-violet-500/40`}
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
				className={`${rowClass} cursor-pointer text-left transition`}
			>
				<span className={labelClass}>
					{item.icon(`size-4 shrink-0 ${active ? "text-violet-300" : "text-violet-400/50"}`)}
					<span className="min-w-0 flex-1 truncate">{label}</span>
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
					{billingWarning && (
						<Tooltip content={billingOverdueLabel} side="right">
							<span aria-label={billingOverdueLabel} className="text-amber-300">
								<AlertIcon className="size-4" />
							</span>
						</Tooltip>
					)}
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
				className="flex cursor-pointer items-center gap-2.5 px-5 py-5 transition hover:opacity-90"
				aria-label={t("nav.home")}
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
					className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-violet-500/15 bg-white/[0.02] px-3 py-2 text-left text-sm text-violet-300/70 transition hover:border-violet-500/25 hover:bg-white/[0.04] hover:text-violet-100"
				>
					<SearchIcon className="size-4 shrink-0 text-violet-400/50" />
					<span className="flex-1">{t("nav.search")}</span>
					<span className="inline-flex items-center gap-0.5">
						<kbd>{modKey}</kbd>
						<kbd>K</kbd>
					</span>
				</button>
			</div>

			<nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-2">
				<div className="space-y-1">{PRIMARY_NAV.map(renderNavItem)}</div>
				<div className="mt-auto pt-6">
					<p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-violet-400/40 uppercase">
						{t("nav.workspace")}
					</p>
					<div className="space-y-1">
						{WORKSPACE_NAV.filter((item) => !item.adminOnly || canAccessSettings(user.workspaceRole)).map(
							renderNavItem,
						)}
					</div>
				</div>
			</nav>

			<div className="border-t border-violet-500/10 p-3">
				<div className="flex items-center gap-1 rounded-lg p-1">
					<Tooltip content={t("nav.accountSettings")}>
						<button
							type="button"
							onClick={() => onNavigate("account")}
							aria-label={t("nav.accountSettings")}
							className={`group flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-white/[0.05] ${
								route === "account" ? "bg-violet-500/15" : ""
							}`}
						>
							<UserAvatar name={user.name} avatarUrl={user.avatarUrl} sizeClass="size-8" textClass="text-xs" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-violet-50">{user.name}</p>
								<p className="truncate text-xs text-violet-400/50">{user.role}</p>
							</div>
							<PencilIcon className="size-3.5 shrink-0 text-violet-400/40 transition group-hover:text-violet-200" />
						</button>
					</Tooltip>
					<Tooltip content={t("nav.signOut")}>
						<button
							type="button"
							onClick={() => setShowLogoutConfirm(true)}
							aria-label={t("nav.signOut")}
							className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-violet-300/60 transition hover:bg-white/[0.05] hover:text-violet-100"
						>
							<LogOutIcon className="size-4" />
						</button>
					</Tooltip>
				</div>
			</div>
		</div>
	);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-void text-violet-50">
			<UserProfileHost />
			{showLogoutConfirm && (
				<Modal title={`${t("nav.signOut")}?`} onClose={() => setShowLogoutConfirm(false)}>
					<div className="space-y-4">
						<p className="text-sm leading-relaxed text-violet-200/80">
							You will need to sign in again to access the {user.company} workspace.
						</p>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowLogoutConfirm(false)}
								className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:bg-white/[0.04] hover:text-violet-100"
							>
								{t("common.cancel")}
							</button>
							<button
								type="button"
								onClick={() => {
									setShowLogoutConfirm(false);
									onLogout();
								}}
								className="cursor-pointer rounded-lg bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30"
							>
								{t("nav.signOut")}
							</button>
						</div>
					</div>
				</Modal>
			)}

			<OverPlanBanner onChangePlan={() => onNavigate("billing")} />
			{user.impersonating && (
				<div
					role="status"
					className="shrink-0 border-b border-sky-400/30 bg-sky-500/15 px-4 py-2.5 text-sky-50"
				>
					<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
						<p className="text-pretty">
							Viewing as {user.name} ({user.username}). This session was opened from Admin and is
							tracked for internal audit.
						</p>
						<button
							type="button"
							onClick={onLogout}
							className="cursor-pointer rounded-lg border border-sky-300/40 bg-sky-500/25 px-3 py-1.5 text-xs font-semibold text-sky-50 transition hover:bg-sky-500/40"
						>
							End session
						</button>
					</div>
				</div>
			)}

			<div className="flex min-h-0 flex-1 overflow-hidden">
				<aside className="hidden w-60 shrink-0 border-r border-violet-500/10 lg:block">{sidebar}</aside>

				{mobileNavOpen && (
					<div className="fixed inset-0 z-40 lg:hidden">
						<button
							type="button"
							aria-label={t("common.close")}
							className="absolute inset-0 cursor-pointer bg-black/60"
							onClick={onToggleMobileNav}
						/>
						<aside className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-violet-500/10 shadow-2xl">
							{sidebar}
						</aside>
					</div>
				)}

				<div className="flex min-w-0 flex-1 flex-col">
					<header className="flex items-center gap-3 border-b border-violet-500/10 px-4 py-3 lg:hidden">
						<button
							type="button"
							aria-label="Open menu"
							onClick={onToggleMobileNav}
							className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-violet-500/20 text-violet-200 transition hover:bg-white/[0.04]"
						>
							<MenuIcon className="size-4" />
						</button>
						<div className="flex items-center gap-2">
							<img src={logo} alt="" className="h-6 w-6" />
							<span className="font-display text-sm font-semibold text-violet-50">Lumantic</span>
						</div>
					</header>
					<main className="min-h-0 flex-1">{children}</main>
				</div>
			</div>
		</div>
	);
}
