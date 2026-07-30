import { useCallback, useEffect, useState } from "react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { SpinnerIcon } from "../../components/Icons";
import { AppAuthProvider, useAppAuth } from "./context";
import { queryClient } from "./queryClient";
import { TooltipProvider } from "./ui";
import { AuthScreen } from "./AuthScreen";
import { AppShell } from "./AppShell";
import { ChatPage } from "./ChatPage";
import { MemoriesPage } from "./MemoriesPage";
import { SettingsPage } from "./SettingsPage";
import { TeamPage } from "./TeamPage";
import { BillingPage } from "./BillingPage";
import { SupportPage } from "./SupportPage";
import { pathToRoute, routeToPath, type AppRoute } from "./routes";
import type { ProposedMemory } from "./types";

function usePathname() {
	const [pathname, setPathname] = useState(() => window.location.pathname);

	useEffect(() => {
		const onPopState = () => setPathname(window.location.pathname);
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	const navigate = useCallback((path: string) => {
		if (path === window.location.pathname) return;
		window.history.pushState({}, "", path);
		setPathname(path);
	}, []);

	return [pathname, navigate] as const;
}

function AuthenticatedApp() {
	const { user, logout, request } = useAppAuth();
	const [pathname, navigate] = usePathname();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	const route = pathToRoute(pathname);

	// Shared with ProposedMemoriesPage/SupportPage via the same query keys, so
	// approving/denying a proposed memory or filing a ticket updates these
	// sidebar badges without any manual prop plumbing.
	const { data: proposedData } = useQuery({
		queryKey: ["proposed-memories"],
		queryFn: () => request<{ proposedMemories: ProposedMemory[] }>("/proposed-memories"),
	});
	const { data: supportData } = useQuery({
		queryKey: ["support-tickets"],
		queryFn: () => request<{ openCount: number }>("/support/tickets"),
	});

	function handleNavigate(next: AppRoute) {
		navigate(routeToPath(next));
		setMobileNavOpen(false);
	}

	return (
		<AppShell
			route={route}
			onNavigate={handleNavigate}
			proposedCount={proposedData?.proposedMemories.length ?? 0}
			openTicketCount={supportData?.openCount ?? 0}
			user={user!}
			onLogout={logout}
			mobileNavOpen={mobileNavOpen}
			onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
		>
			{route === "chat" && <ChatPage />}
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
			{route === "settings" && <SettingsPage />}
		</AppShell>
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
					<AppRouter />
					<Toaster
						theme="dark"
						position="bottom-right"
						toastOptions={{
							classNames: {
								toast: "!rounded-xl !border !border-violet-500/20 !bg-ink !text-violet-50 !shadow-[0_0_40px_-15px_rgba(143,99,248,0.5)] !font-sans",
								title: "!text-violet-50 !font-medium",
								description: "!text-violet-300/70",
								actionButton: "!bg-gradient-to-r !from-violet-500 !to-violet-400 !text-white",
								cancelButton: "!bg-white/10 !text-violet-200",
								closeButton: "!border-violet-500/20 !bg-white/5 !text-violet-300",
								success: "!border-emerald-500/25",
								error: "!border-rose-500/25",
							},
						}}
					/>
				</TooltipProvider>
			</AppAuthProvider>
		</QueryClientProvider>
	);
}
