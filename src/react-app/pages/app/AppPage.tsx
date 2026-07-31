import { useCallback, useEffect, useState } from "react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { SpinnerIcon } from "../../components/Icons";
import { AppAuthProvider, useAppAuth } from "./context";
import { queryClient } from "./queryClient";
import { TooltipProvider } from "./ui";
import { AccountPage } from "./AccountPage";
import { AuthScreen } from "./AuthScreen";
import { AppShell } from "./AppShell";
import { ChatPage } from "./ChatPage";
import { CommandPalette, LOGOUT_CONFIRM_EVENT, OPEN_CMDK_EVENT } from "./CommandPalette";
import { KeyboardShortcutsModal, NAV_SHORTCUTS, OPEN_SHORTCUTS_EVENT, GO_PREFIX_MS, isTypingTarget } from "./KeyboardShortcuts";
import { MemoriesPage } from "./MemoriesPage";
import { SettingsPage } from "./SettingsPage";
import { TeamPage } from "./TeamPage";
import { BillingPage } from "./BillingPage";
import { SupportPage } from "./SupportPage";
import { pathToRoute, routeToPath, type AppRoute } from "./routes";
import type { ProposedMemory } from "./types";
import { canAccessSettings } from "../../../shared/access";
import { AppI18nProvider, AppLocaleSync } from "./i18n";

function readLocation() {
	return { pathname: window.location.pathname, search: window.location.search };
}

function useAppLocation() {
	const [location, setLocation] = useState(readLocation);

	useEffect(() => {
		const onPopState = () => setLocation(readLocation());
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
		const url = new URL(to, window.location.origin);
		const nextPath = url.pathname;
		const nextSearch = url.search;
		const same = nextPath === window.location.pathname && nextSearch === window.location.search;
		if (!same) {
			if (opts?.replace) window.history.replaceState({}, "", `${nextPath}${nextSearch}`);
			else window.history.pushState({}, "", `${nextPath}${nextSearch}`);
		}
		setLocation({ pathname: nextPath, search: nextSearch });
	}, []);

	return [location, navigate] as const;
}

function AuthenticatedApp() {
	const { user, logout, request } = useAppAuth();
	const [location, navigate] = useAppLocation();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [cmdkOpen, setCmdkOpen] = useState(false);
	const [shortcutsOpen, setShortcutsOpen] = useState(false);

	const route = pathToRoute(location.pathname);
	const isAdmin = canAccessSettings(user?.workspaceRole);

	const { data: proposedData } = useQuery({
		queryKey: ["proposed-memories"],
		queryFn: () => request<{ proposedMemories: ProposedMemory[] }>("/proposed-memories"),
	});
	const { data: supportData } = useQuery({
		queryKey: ["support-tickets"],
		queryFn: () => request<{ openCount: number }>("/support/tickets"),
	});
	const { data: unreadData } = useQuery({
		queryKey: ["chat-unread"],
		queryFn: () => request<{ unreadCount: number }>("/conversations/unread-count"),
	});
	const unreadChatCount = unreadData?.unreadCount ?? 0;

	function handleNavigate(next: AppRoute) {
		if (next === "settings" && !canAccessSettings(user?.workspaceRole)) {
			navigate(routeToPath("chat"));
			setMobileNavOpen(false);
			return;
		}
		navigate(routeToPath(next));
		setMobileNavOpen(false);
	}

	useEffect(() => {
		if (route === "settings" && !canAccessSettings(user?.workspaceRole)) {
			navigate(routeToPath("chat"), { replace: true });
		}
	}, [route, user?.workspaceRole, navigate]);

	useEffect(() => {
		let goArmedUntil = 0;
		let goTimer: number | undefined;

		function clearGoPrefix() {
			goArmedUntil = 0;
			if (goTimer != null) {
				window.clearTimeout(goTimer);
				goTimer = undefined;
			}
		}

		function armGoPrefix() {
			goArmedUntil = Date.now() + GO_PREFIX_MS;
			if (goTimer != null) window.clearTimeout(goTimer);
			goTimer = window.setTimeout(() => {
				goArmedUntil = 0;
				goTimer = undefined;
			}, GO_PREFIX_MS);
		}

		function onKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				clearGoPrefix();
				setShortcutsOpen(false);
				setCmdkOpen((v) => !v);
				return;
			}

			if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
				if (isTypingTarget(e.target) || cmdkOpen) return;
				e.preventDefault();
				clearGoPrefix();
				setShortcutsOpen((v) => !v);
				return;
			}

			if (e.metaKey || e.ctrlKey || e.altKey) return;
			if (isTypingTarget(e.target) || cmdkOpen || shortcutsOpen) {
				clearGoPrefix();
				return;
			}

			const key = e.key.length === 1 ? e.key.toLowerCase() : "";
			if (!key) return;

			const goArmed = Date.now() < goArmedUntil;

			if (goArmed) {
				e.preventDefault();
				clearGoPrefix();
				const match = NAV_SHORTCUTS.find((s) => s.key === key);
				if (!match) return;
				if (match.adminOnly && !canAccessSettings(user?.workspaceRole)) return;
				setMobileNavOpen(false);
				navigate(match.path);
				return;
			}

			if (key === "g") {
				e.preventDefault();
				armGoPrefix();
			}
		}
		function onOpenCmdk() {
			clearGoPrefix();
			setShortcutsOpen(false);
			setCmdkOpen(true);
		}
		function onOpenShortcuts() {
			clearGoPrefix();
			setCmdkOpen(false);
			setShortcutsOpen(true);
		}
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener(OPEN_CMDK_EVENT, onOpenCmdk);
		window.addEventListener(OPEN_SHORTCUTS_EVENT, onOpenShortcuts);
		return () => {
			clearGoPrefix();
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener(OPEN_CMDK_EVENT, onOpenCmdk);
			window.removeEventListener(OPEN_SHORTCUTS_EVENT, onOpenShortcuts);
		};
	}, [cmdkOpen, shortcutsOpen, navigate, user?.workspaceRole]);

	return (
		<AppLocaleSync>
			<>
			<AppShell
				route={route}
				onNavigate={handleNavigate}
				proposedCount={proposedData?.proposedMemories.length ?? 0}
				openTicketCount={supportData?.openCount ?? 0}
				unreadChatCount={unreadChatCount}
				user={user!}
				onLogout={logout}
				mobileNavOpen={mobileNavOpen}
				onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
			>
				{route === "chat" && <ChatPage locationSearch={location.search} onNavigate={navigate} />}
				{(route === "memories" || route === "proposed") && (
					<MemoriesPage
						tab={route === "proposed" ? "proposed" : "confirmed"}
						proposedCount={proposedData?.proposedMemories.length ?? 0}
						onTabChange={(tab) => handleNavigate(tab === "proposed" ? "proposed" : "memories")}
					/>
				)}
				{route === "team" && <TeamPage />}
				{route === "billing" && <BillingPage />}
				{route === "support" && <SupportPage />}
				{route === "account" && <AccountPage />}
				{route === "settings" && isAdmin && <SettingsPage />}
			</AppShell>

			<CommandPalette
				open={cmdkOpen}
				onOpenChange={setCmdkOpen}
				canAccessSettings={isAdmin}
				onNavigate={(to) => {
					navigate(to);
					setMobileNavOpen(false);
				}}
				onOpenEditProfile={() => handleNavigate("account")}
				onRequestLogout={() => window.dispatchEvent(new Event(LOGOUT_CONFIRM_EVENT))}
				onOpenShortcuts={() => {
					setCmdkOpen(false);
					setShortcutsOpen(true);
				}}
			/>
			<KeyboardShortcutsModal
				open={shortcutsOpen}
				onClose={() => setShortcutsOpen(false)}
				canAccessSettings={isAdmin}
			/>
			</>
		</AppLocaleSync>
	);
}

function AppRouter() {
	const { user, checkingSession } = useAppAuth();

	if (checkingSession) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-void">
				<SpinnerIcon className="size-6 text-violet-400" />
			</div>
		);
	}

	if (!user) return <AuthScreen />;

	return <AuthenticatedApp />;
}

export function AppPage() {
	return (
		<QueryClientProvider client={queryClient}>
			<AppAuthProvider>
				<TooltipProvider>
					<AppI18nProvider>
						<AppRouter />
					</AppI18nProvider>
				</TooltipProvider>
			</AppAuthProvider>
		</QueryClientProvider>
	);
}
