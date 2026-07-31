import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	AlertIcon,
	BrainIcon,
	ChatIcon,
	CreditCardIcon,
	FlagIcon,
	GearIcon,
	GlobeIcon,
	LifeBuoyIcon,
	LogOutIcon,
	PencilIcon,
	PlusIcon,
	SearchIcon,
	SparkleIcon,
	UserIcon,
	UsersIcon,
} from "../../components/Icons";
import { useAppAuth } from "./context";
import { FEATURE_FLAG_DEFS, featureFlagsEnabled, toggleFeatureFlag, useFeatureFlagSnapshot } from "./featureFlags";
import type { AppUser, Conversation } from "./types";
import type { AppRoute } from "./routes";

export const OPEN_CMDK_EVENT = "lumantic-open-cmdk";
export const EDIT_PROFILE_EVENT = "lumantic-edit-profile";
export const LOGOUT_CONFIRM_EVENT = "lumantic-logout-confirm";

type CommandItem = {
	id: string;
	label: string;
	group: string;
	hint?: string;
	keywords?: string;
	icon: ReactNode;
	run: () => void;
};

const NAV_ITEMS: {
	route: AppRoute;
	label: string;
	keywords: string;
	icon: (c: string) => ReactNode;
	adminOnly?: boolean;
}[] = [
	{ route: "chat", label: "Go to Chat", keywords: "home inbox messages", icon: (c) => <ChatIcon className={c} /> },
	{
		route: "memories",
		label: "Go to Memories",
		keywords: "knowledge confirmed",
		icon: (c) => <BrainIcon className={c} />,
	},
	{
		route: "proposed",
		label: "Go to Proposed memories",
		keywords: "review approve",
		icon: (c) => <BrainIcon className={c} />,
	},
	{ route: "team", label: "Go to Team", keywords: "members invite", icon: (c) => <UsersIcon className={c} /> },
	{
		route: "billing",
		label: "Go to Billing",
		keywords: "plan usage invoice",
		icon: (c) => <CreditCardIcon className={c} />,
	},
	{ route: "support", label: "Go to Support", keywords: "help tickets", icon: (c) => <LifeBuoyIcon className={c} /> },
	{
		route: "account",
		label: "Go to Account settings",
		keywords: "profile language currency timezone email notifications preferences",
		icon: (c) => <UserIcon className={c} />,
	},
	{
		route: "settings",
		label: "Go to Workspace settings",
		keywords: "integrations slack github gitlab datadog sentry segment mixpanel incident launchdarkly",
		icon: (c) => <GearIcon className={c} />,
		adminOnly: true,
	},
];

function matchesQuery(item: CommandItem, q: string) {
	if (!q) return true;
	const hay = `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""} ${item.group}`.toLowerCase();
	return q.split(/\s+/).every((part) => hay.includes(part));
}

export function CommandPalette({
	open,
	onOpenChange,
	onNavigate,
	onOpenEditProfile,
	onRequestLogout,
	onOpenShortcuts,
	canAccessSettings = false,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onNavigate: (to: string) => void;
	onOpenEditProfile: () => void;
	onRequestLogout: () => void;
	onOpenShortcuts?: () => void;
	canAccessSettings?: boolean;
}) {
	const { request, applyUser } = useAppAuth();
	const queryClient = useQueryClient();
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const [personal, setPersonal] = useState<Conversation[]>([]);
	const [globalApi, setGlobalApi] = useState<Conversation[]>([]);
	const flagSnapshot = useFeatureFlagSnapshot();
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const showDevSection = featureFlagsEnabled();
	const [wasOpen, setWasOpen] = useState(false);
	const [queryForIndex, setQueryForIndex] = useState(query);

	const runDevAction = useCallback(
		async (body: Record<string, unknown>, successMessage: string, opts?: { invalidateBilling?: boolean }) => {
			try {
				const data = await request<{ ok?: boolean; user?: AppUser; error?: string }>("/dev", {
					method: "POST",
					body: JSON.stringify(body),
				});
				if (data.user) applyUser(data.user);
				if (opts?.invalidateBilling) {
					await queryClient.invalidateQueries({ queryKey: ["billing-over-plan"] });
				}
				toast.success(successMessage);
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Dev action failed");
			}
		},
		[applyUser, queryClient, request],
	);

	if (open && !wasOpen) {
		setWasOpen(true);
		setQuery("");
		setActiveIndex(0);
		setQueryForIndex("");
	} else if (!open && wasOpen) {
		setWasOpen(false);
	}

	useEffect(() => {
		if (!open) return;
		inputRef.current?.focus();
		Promise.all([
			request<{ conversations: Conversation[] }>("/conversations?scope=personal&archived=0&page=1&pageSize=50"),
			request<{ conversations: Conversation[] }>("/conversations?scope=global&archived=0&page=1&pageSize=50"),
		])
			.then(([p, g]) => {
				setPersonal(p.conversations.filter((c) => !c.archived).slice(0, 12));
				setGlobalApi(g.conversations.filter((c) => !c.archived).slice(0, 12));
			})
			.catch(() => {
				setPersonal([]);
				setGlobalApi([]);
			});
	}, [open, request]);

	const items = useMemo(() => {
		const closeAnd = (fn: () => void) => () => {
			onOpenChange(false);
			fn();
		};

		const list: CommandItem[] = [
			{
				id: "nav-new-personal",
				label: "New personal chat",
				group: "Actions",
				keywords: "compose create",
				icon: <PlusIcon className="size-4" />,
				run: closeAnd(() => onNavigate("/app?new=personal")),
			},
			{
				id: "nav-new-global",
				label: "New global chat",
				group: "Actions",
				keywords: "compose create shared",
				icon: <PlusIcon className="size-4" />,
				run: closeAnd(() => onNavigate("/app?new=global")),
			},
			{
				id: "nav-edit-profile",
				label: "Account settings",
				group: "Actions",
				keywords: "edit profile name role account language currency email",
				icon: <PencilIcon className="size-4" />,
				run: closeAnd(onOpenEditProfile),
			},
			...(onOpenShortcuts
				? [
						{
							id: "nav-shortcuts",
							label: "Keyboard shortcuts",
							group: "Actions",
							hint: "?",
							keywords: "keys hotkeys help",
							icon: (
								<span className="flex size-4 items-center justify-center text-[11px] font-semibold leading-none">
									?
								</span>
							),
							run: closeAnd(onOpenShortcuts),
						},
					]
				: []),
			{
				id: "nav-logout",
				label: "Log out",
				group: "Actions",
				keywords: "sign out exit",
				icon: <LogOutIcon className="size-4" />,
				run: closeAnd(onRequestLogout),
			},
			...NAV_ITEMS.filter((item) => !item.adminOnly || canAccessSettings).map((item) => ({
				id: `route-${item.route}`,
				label: item.label,
				group: "Navigate",
				keywords: item.keywords,
				icon: item.icon("size-4"),
				run: closeAnd(() => {
					const path =
						item.route === "chat"
							? "/app"
							: item.route === "memories"
								? "/app/memories"
								: item.route === "proposed"
									? "/app/proposed"
									: item.route === "team"
										? "/app/team"
										: item.route === "billing"
											? "/app/billing"
											: item.route === "support"
												? "/app/support"
												: item.route === "account"
													? "/app/account"
													: "/app/settings";
					onNavigate(path);
				}),
			})),
			...personal.map((c) => ({
				id: `personal-${c.id}`,
				label: c.title || "Untitled chat",
				group: "Personal chats",
				hint: "Personal",
				keywords: "chat conversation thread",
				icon: <UserIcon className="size-4" />,
				run: closeAnd(() => onNavigate(`/app?c=${c.id}&scope=personal`)),
			})),
			...globalApi.map((c) => ({
				id: `global-api-${c.id}`,
				label: c.title || "Untitled chat",
				group: "Global chats",
				hint: c.author_name ? `Shared · ${c.author_name}` : "Shared",
				keywords: "chat conversation thread global shared",
				icon: <GlobeIcon className="size-4" />,
				run: closeAnd(() => onNavigate(`/app?c=${c.id}&scope=global`)),
			})),
			...(showDevSection
				? [
						{
							id: "dev-role-admin",
							label: "Make current user Admin",
							group: "Dev only",
							keywords: "dev tools role workspace admin settings permission",
							icon: <UsersIcon className="size-4" />,
							run: closeAnd(() => {
								void runDevAction(
									{ action: "setWorkspaceRole", role: "Admin" },
									"You are now a workspace Admin",
								);
							}),
						},
						{
							id: "dev-role-owner",
							label: "Make current user Owner",
							group: "Dev only",
							keywords: "dev tools role workspace owner permission",
							icon: <UsersIcon className="size-4" />,
							run: closeAnd(() => {
								void runDevAction(
									{ action: "setWorkspaceRole", role: "Owner" },
									"You are now the workspace Owner",
								);
							}),
						},
						{
							id: "dev-role-member",
							label: "Make current user Member",
							group: "Dev only",
							keywords: "dev tools role workspace member permission demote",
							icon: <UserIcon className="size-4" />,
							run: closeAnd(() => {
								void runDevAction(
									{ action: "setWorkspaceRole", role: "Member" },
									"You are now a workspace Member",
								);
							}),
						},
						{
							id: "dev-billing-overdue",
							label: "Simulate bill not paid",
							group: "Dev only",
							keywords: "dev tools billing overdue unpaid invoice payment failed",
							icon: <AlertIcon className="size-4" />,
							run: closeAnd(() => {
								void runDevAction(
									{ action: "setBillingStatus", status: "overdue" },
									"Billing marked overdue",
									{ invalidateBilling: true },
								);
							}),
						},
						{
							id: "dev-billing-active",
							label: "Mark bill as paid",
							group: "Dev only",
							keywords: "dev tools billing active paid clear overdue",
							icon: <CreditCardIcon className="size-4" />,
							run: closeAnd(() => {
								void runDevAction(
									{ action: "setBillingStatus", status: "active" },
									"Billing marked active",
									{ invalidateBilling: true },
								);
							}),
						},
						{
							id: "dev-plan-starter",
							label: "Switch plan to Starter",
							group: "Dev only",
							keywords: "dev tools plan starter quota overage",
							icon: <SparkleIcon className="size-4" />,
							run: closeAnd(() => {
								void runDevAction(
									{ action: "setPlan", planId: "starter" },
									"Plan set to Starter",
									{ invalidateBilling: true },
								);
							}),
						},
						{
							id: "dev-plan-scale",
							label: "Switch plan to Scale",
							group: "Dev only",
							keywords: "dev tools plan scale",
							icon: <SparkleIcon className="size-4" />,
							run: closeAnd(() => {
								void runDevAction(
									{ action: "setPlan", planId: "scale" },
									"Plan set to Scale",
									{ invalidateBilling: true },
								);
							}),
						},
						...FEATURE_FLAG_DEFS.map((flag) => {
							const stored = flagSnapshot[flag.key];
							const on = typeof stored === "boolean" ? stored : flag.defaultValue;
							return {
								id: `flag-${flag.key}`,
								label: flag.label,
								group: "Dev only",
								hint: on ? "On" : "Off",
								keywords: `dev flag feature toggle ${flag.description} ${flag.key}`,
								icon: <FlagIcon className="size-4" />,
								run: () => toggleFeatureFlag(flag.key),
							};
						}),
					]
				: []),
		];

		const q = query.trim().toLowerCase();
		return list.filter((item) => matchesQuery(item, q));
	}, [
		query,
		personal,
		globalApi,
		onNavigate,
		onOpenChange,
		onOpenEditProfile,
		onRequestLogout,
		onOpenShortcuts,
		showDevSection,
		flagSnapshot,
		canAccessSettings,
		runDevAction,
	]);

	if (query !== queryForIndex) {
		setQueryForIndex(query);
		setActiveIndex(0);
	} else if (items.length > 0 && activeIndex >= items.length) {
		setActiveIndex(0);
	}

	useEffect(() => {
		const el = listRef.current?.querySelector<HTMLElement>(`[data-cmdk-index="${activeIndex}"]`);
		el?.scrollIntoView({ block: "nearest" });
	}, [activeIndex]);

	if (!open) return null;

	const groups = items.reduce<{ name: string; items: { item: CommandItem; index: number }[] }[]>((acc, item, index) => {
		const last = acc[acc.length - 1];
		if (last && last.name === item.group) last.items.push({ item, index });
		else acc.push({ name: item.group, items: [{ item, index }] });
		return acc;
	}, []);

	return (
		<div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh]">
			<button
				type="button"
				aria-label="Dismiss"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={() => onOpenChange(false)}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Command menu"
				className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-violet-500/20 bg-ink shadow-[0_0_80px_-15px_rgba(143,99,248,0.45)]"
			>
				<div className="flex items-center gap-2 border-b border-violet-500/15 px-3.5 py-3">
					<SearchIcon className="size-4 shrink-0 text-violet-400/50" />
					<input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Jump to a page, chat, or action..."
						className="min-w-0 flex-1 bg-transparent text-sm text-violet-50 outline-none placeholder:text-violet-400/40"
						onKeyDown={(e) => {
							if (e.key === "ArrowDown") {
								e.preventDefault();
								setActiveIndex((i) => Math.min(items.length - 1, i + 1));
							} else if (e.key === "ArrowUp") {
								e.preventDefault();
								setActiveIndex((i) => Math.max(0, i - 1));
							} else if (e.key === "Enter") {
								e.preventDefault();
								items[activeIndex]?.run();
							} else if (e.key === "Escape") {
								e.preventDefault();
								onOpenChange(false);
							}
						}}
					/>
					<kbd className="hidden sm:inline">esc</kbd>
				</div>

				<div ref={listRef} className="max-h-[min(28rem,55vh)] overflow-y-auto py-2">
					{items.length === 0 ? (
						<p className="px-4 py-8 text-center text-sm text-violet-400/50">No matches</p>
					) : (
						groups.map((group) => (
							<div key={group.name} className="mb-1">
								<p className="px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-violet-400/45 uppercase">
									{group.name}
								</p>
								{group.items.map(({ item, index }) => {
									const active = index === activeIndex;
									return (
										<button
											key={item.id}
											type="button"
											data-cmdk-index={index}
											onMouseEnter={() => setActiveIndex(index)}
											onClick={() => item.run()}
											className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition ${
												active ? "bg-violet-500/15 text-violet-50" : "text-violet-200/80 hover:bg-white/[0.03]"
											}`}
										>
											<span className={`shrink-0 ${active ? "text-violet-200" : "text-violet-400/50"}`}>
												{item.icon}
											</span>
											<span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
											{item.hint &&
												(item.id === "nav-shortcuts" ? (
													<kbd className="shrink-0">{item.hint}</kbd>
												) : (
													<span
														className={`shrink-0 text-[11px] ${
															item.group === "Dev only"
																? item.hint === "On"
																	? "font-semibold text-emerald-300/80"
																	: "text-violet-400/45"
																: "text-violet-400/45"
														}`}
													>
														{item.hint}
													</span>
												))}
										</button>
									);
								})}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
