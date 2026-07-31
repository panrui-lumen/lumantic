import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import logo from "../assets/lumantic-logo.png";
import {
	AlertIcon,
	CheckIcon,
	ChevronLeft,
	ChevronRight,
	CloseIcon,
	CreditCardIcon,
	DownloadIcon,
	ExternalLinkIcon,
	LifeBuoyIcon,
	LockIcon,
	LogOutIcon,
	MailIcon,
	MoreHorizontalIcon,
	PlusIcon,
	SearchIcon,
	SpinnerIcon,
	TrashIcon,
	UsersIcon,
	LogInIcon,
} from "../components/Icons";
import { Select } from "../components/Select";
import { DatePicker } from "../components/DatePicker";
import { ConfirmModal } from "../components/ConfirmModal";
import { Tooltip, TooltipProvider } from "../components/Tooltip";
import { UptimeBar, type UptimeDay } from "../components/UptimeBar";
import {
	WORKSPACE_BILLING_STATUSES,
	WORKSPACE_PLAN_IDS,
	billingStatusLabel,
	formatMrrCents,
	planLabel,
	type WorkspaceBillingStatus,
	type WorkspacePlanId,
} from "../../shared/workspaces";

const STORAGE_KEY = "lumantic_admin_password";
const DISCLAIMER_DISMISSED_KEY = "lumantic_admin_employee_disclaimer_dismissed";
const PAGE_SIZE = 12;

type AdminTab = "general" | "waitlist" | "workspaces" | "support" | "audit" | "status";
type Registration = { id: number; email: string; created_at: string };
type Sort = "newest" | "oldest";
type BannerState = { enabled: boolean; message: string; updatedAt: string | null };
type Overview = {
	registrations: number;
	workspaces: number;
	overdueWorkspaces: number;
	openTickets: number;
	users: number;
};
type Workspace = {
	id: number;
	name: string;
	slug: string;
	planId: string;
	billingStatus: string;
	overdueSince: string | null;
	renewsAt: string | null;
	seatLimit: number;
	mrrCents: number;
	primaryContactEmail: string | null;
	notes: string;
	isLive: boolean;
	userCount: number;
	createdAt: string;
	updatedAt: string;
};
type WorkspaceMember = {
	id: number;
	name: string;
	email: string;
	role: string;
	status: string;
	is_you: number;
	last_active_at: string | null;
	created_at: string;
	workspace_id: number;
};
type SupportTicket = {
	id: number;
	subject: string;
	message: string;
	status: string;
	created_at: string;
	ownerEmployeeId: number | null;
	ownerName: string | null;
};
type AdminEmployee = {
	id: number;
	name: string;
	createdAt: string;
};
type AuditEvent = {
	id: number;
	createdAt: string;
	action: string;
	actor: string;
	reason: string | null;
	targetMemberId: number | null;
	targetEmail: string | null;
	targetWorkspaceId: number | null;
	targetWorkspaceName: string | null;
	summary: string;
};

const TAB_IDS: AdminTab[] = ["general", "waitlist", "workspaces", "support", "status", "audit"];
const TAB_LABELS: Record<AdminTab, string> = {
	general: "General",
	waitlist: "Email waitlist",
	workspaces: "Workspaces",
	support: "Support",
	status: "Status / uptime",
	audit: "Audit trail",
};

function parseTab(raw: string | null | undefined): AdminTab {
	if (
		raw === "waitlist" ||
		raw === "workspaces" ||
		raw === "support" ||
		raw === "general" ||
		raw === "audit" ||
		raw === "status"
	) {
		return raw;
	}
	return "general";
}

function parseAdminPath(pathname: string): { tab: AdminTab; customerId: number | null } {
	const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
	if (parts[0] !== "admin") return { tab: "general", customerId: null };
	const tab = parseTab(parts[1] ?? "general");
	let customerId: number | null = null;
	if (tab === "workspaces" && parts[2]) {
		const n = Number(parts[2]);
		if (Number.isInteger(n) && n > 0) customerId = n;
	}
	return { tab, customerId };
}

function adminPath(tab: AdminTab, customerId: number | null = null): string {
	if (tab === "general") return "/admin";
	if (tab === "workspaces" && customerId != null) return `/admin/workspaces/${customerId}`;
	return `/admin/${tab}`;
}

/** Migrate legacy `?tab=` / `?customer=` URLs to path-based admin routes. */
function migrateLegacyAdminSearch(): { tab: AdminTab; customerId: number | null } | null {
	const url = new URL(window.location.href);
	const legacyTab = url.searchParams.get("tab");
	const legacyCustomer = url.searchParams.get("customer");
	if (!legacyTab && !legacyCustomer) return null;

	const tab = parseTab(legacyTab ?? parseAdminPath(url.pathname).tab);
	let customerId: number | null = null;
	if (tab === "workspaces" && legacyCustomer) {
		const n = Number(legacyCustomer);
		if (Number.isInteger(n) && n > 0) customerId = n;
	}
	url.searchParams.delete("tab");
	url.searchParams.delete("customer");
	const next = adminPath(tab, customerId);
	const qs = url.searchParams.toString();
	window.history.replaceState({}, "", qs ? `${next}?${qs}` : next);
	return { tab, customerId };
}

function readAdminLocation(): { tab: AdminTab; customerId: number | null } {
	const migrated = migrateLegacyAdminSearch();
	if (migrated) return migrated;
	return parseAdminPath(window.location.pathname);
}

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}

function formatDay(iso: string | null) {
	if (!iso) return "-";
	try {
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
	} catch {
		return iso;
	}
}

function statusTone(status: string): string {
	switch (status) {
		case "active":
			return "border-emerald-500/25 bg-emerald-500/15 text-emerald-300";
		case "trial":
			return "border-sky-500/25 bg-sky-500/15 text-sky-300";
		case "overdue":
			return "border-rose-500/25 bg-rose-500/15 text-rose-300";
		case "canceled":
			return "border-violet-500/20 bg-white/[0.04] text-violet-300/70";
		default:
			return "border-violet-500/20 bg-white/[0.04] text-violet-300/70";
	}
}

async function adminFetch(password: string, path: string, init?: RequestInit) {
	const headers = new Headers(init?.headers);
	headers.set("x-admin-password", password);
	if (init?.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	return fetch(`/api/admin${path}`, { ...init, headers });
}

function AdminEmployeeDisclaimer({ className = "" }: { className?: string }) {
	const [dismissed, setDismissed] = useState(() => {
		try {
			return localStorage.getItem(DISCLAIMER_DISMISSED_KEY) === "1";
		} catch {
			return false;
		}
	});

	if (dismissed) return null;

	function dismiss() {
		try {
			localStorage.setItem(DISCLAIMER_DISMISSED_KEY, "1");
		} catch {
			// ignore
		}
		setDismissed(true);
	}

	return (
		<div
			role="note"
			className={`relative rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2.5 pr-10 text-left shadow-[0_0_28px_-16px_rgba(251,191,36,0.45)] ${className}`}
		>
			<Tooltip content="Dismiss">
				<button
					type="button"
					onClick={dismiss}
					aria-label="Dismiss"
					className="absolute top-1.5 right-1.5 flex size-7 cursor-pointer items-center justify-center rounded-md text-amber-200/70 transition hover:bg-amber-400/10 hover:text-amber-50"
				>
					<CloseIcon className="size-3.5" />
				</button>
			</Tooltip>
			<div className="flex items-center gap-2 text-amber-200">
				<AlertIcon className="size-4 shrink-0" />
				<p className="font-display text-sm font-semibold tracking-wide">For Lumantic employees only</p>
			</div>
			<p className="mt-1 text-xs leading-relaxed text-amber-100/70">
				This admin console is restricted to <span className="font-semibold text-amber-50">LUMANTIC</span> staff.
				Unauthorized access is prohibited.
			</p>
		</div>
	);
}

function LoginScreen({ onSuccess }: { onSuccess: (password: string) => void }) {
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});
			if (!res.ok) {
				setError("Incorrect password");
				return;
			}
			onSuccess(password);
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="bg-grid flex min-h-screen items-center justify-center bg-void px-4 py-10">
			<div className="pointer-events-none fixed top-1/2 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow rounded-full bg-violet-600/15 blur-[120px]" />

			<div className="relative w-full max-w-md space-y-4">
				<AdminEmployeeDisclaimer />

				<form
					onSubmit={handleSubmit}
					className="w-full rounded-2xl border border-violet-500/20 bg-ink p-8 shadow-[0_0_80px_-15px_rgba(143,99,248,0.4)]"
				>
					<div className="flex flex-col items-center text-center">
						<img src={logo} alt="Lumantic" className="h-10 w-10 drop-shadow-[0_0_16px_rgba(184,148,255,0.6)]" />
						<h1 className="mt-4 font-display text-lg font-semibold text-violet-50">Admin access</h1>
						<p className="mt-1 text-sm text-violet-300/60">Enter the admin password to manage the site.</p>
					</div>

					<div className="relative mt-6">
						<LockIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-violet-400/50" />
						<input
							type="password"
							autoFocus
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							className="w-full rounded-xl border border-violet-500/25 bg-white/[0.03] py-3 pr-4 pl-10 text-sm text-violet-50 transition outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
						/>
					</div>

					{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

					<button
						type="submit"
						disabled={loading || !password}
						className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading && <SpinnerIcon className="size-4" />}
						{loading ? "Checking…" : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}

function SiteBannerPanel({ password, onUnauthorized }: { password: string; onUnauthorized: () => void }) {
	const [enabled, setEnabled] = useState(false);
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await adminFetch(password, "/site-banner");
				if (cancelled) return;
				if (res.status === 401) {
					onUnauthorized();
					return;
				}
				if (!res.ok) throw new Error("Failed to load");
				const data = (await res.json()) as BannerState;
				if (cancelled) return;
				setEnabled(Boolean(data.enabled));
				setMessage(data.message ?? "");
				setError("");
			} catch {
				if (!cancelled) setError("Couldn't load site banner settings.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [password, onUnauthorized]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError("");
		setSaved(false);
		try {
			const res = await adminFetch(password, "/site-banner", {
				method: "PUT",
				body: JSON.stringify({ enabled, message }),
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json()) as BannerState & { error?: string };
			if (!res.ok) {
				setError(data.error || "Couldn't save banner.");
				return;
			}
			setEnabled(Boolean(data.enabled));
			setMessage(data.message ?? "");
			setSaved(true);
			window.dispatchEvent(new Event("lumantic-site-banner-changed"));
		} catch {
			setError("Couldn't save banner.");
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="mb-8 flex justify-center rounded-2xl border border-violet-500/15 bg-white/[0.02] py-10">
				<SpinnerIcon className="size-5 text-violet-400" />
			</div>
		);
	}

	return (
		<form onSubmit={handleSave} className="mb-8 rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="font-display text-base font-semibold text-violet-50">Sitewide banner</h2>
					<p className="mt-1 text-sm text-violet-300/55">
						Shown at the top of the marketing site and signed-in app when enabled.
					</p>
				</div>
				<label className="flex cursor-pointer items-center gap-2 text-sm text-violet-200">
					<input
						type="checkbox"
						checked={enabled}
						onChange={(e) => setEnabled(e.target.checked)}
						className="size-4 rounded border-violet-500/40"
					/>
					Enabled
				</label>
			</div>
			<textarea
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				rows={3}
				maxLength={500}
				placeholder="Banner message"
				className="mt-4 w-full rounded-xl border border-violet-500/20 bg-white/[0.03] px-3 py-2.5 text-sm text-violet-50 outline-none placeholder:text-violet-400/40 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
			/>
			{enabled && message && (
				<div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
					Preview: {message}
				</div>
			)}
			{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
			<div className="mt-4 flex items-center gap-3">
				<button
					type="submit"
					disabled={saving}
					className="flex cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
				>
					{saving ? <SpinnerIcon className="size-4" /> : <CheckIcon className="size-4" />}
					{saving ? "Saving…" : "Save banner"}
				</button>
				{saved && <span className="text-sm text-emerald-300/80">Saved</span>}
			</div>
		</form>
	);
}

function GeneralTab({ password, onUnauthorized }: { password: string; onUnauthorized: () => void }) {
	const [overview, setOverview] = useState<Overview | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await adminFetch(password, "/overview");
				if (cancelled) return;
				if (res.status === 401) {
					onUnauthorized();
					return;
				}
				if (!res.ok) return;
				setOverview((await res.json()) as Overview);
			} catch {
				/* ignore */
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [password, onUnauthorized]);

	const cards = [
		{ label: "Waitlist emails", value: overview?.registrations },
		{ label: "Workspaces", value: overview?.workspaces },
		{ label: "Overdue accounts", value: overview?.overdueWorkspaces },
		{ label: "Open tickets", value: overview?.openTickets },
		{ label: "Users across workspaces", value: overview?.users },
	];

	return (
		<div>
			<div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
				{cards.map((card) => (
					<div key={card.label} className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-4 py-4">
						<p className="text-xs tracking-wide text-violet-400/55 uppercase">{card.label}</p>
						<p className="mt-2 font-display text-2xl font-semibold text-violet-50">
							{card.value == null ? "…" : card.value}
						</p>
					</div>
				))}
			</div>
			<SiteBannerPanel password={password} onUnauthorized={onUnauthorized} />
		</div>
	);
}

function StatusTab({ password, onUnauthorized }: { password: string; onUnauthorized: () => void }) {
	const [enabled, setEnabled] = useState(false);
	const [message, setMessage] = useState("");
	const [noticeLoading, setNoticeLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState(false);
	const [report, setReport] = useState<{
		overall: string;
		checkedAt: string;
		uptime: {
			windowDays: number;
			percent: number | null;
			sampleCount: number;
			okCount: number;
			days: UptimeDay[];
		};
		components: { id: string; name: string; status: string; latencyMs: number | null }[];
		notice: string | null;
	} | null>(null);
	const [reportLoading, setReportLoading] = useState(true);

	const loadNotice = useCallback(async () => {
		try {
			const res = await adminFetch(password, "/status-notice");
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			if (!res.ok) throw new Error("Failed to load");
			const data = (await res.json()) as BannerState;
			setEnabled(Boolean(data.enabled));
			setMessage(data.message ?? "");
			setError("");
		} catch {
			setError("Couldn't load status notice settings.");
		} finally {
			setNoticeLoading(false);
		}
	}, [password, onUnauthorized]);

	const loadReport = useCallback(async () => {
		setReportLoading(true);
		try {
			const res = await fetch("/api/status");
			const data = (await res.json()) as NonNullable<typeof report>;
			setReport(data);
		} catch {
			setReport(null);
		} finally {
			setReportLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadNotice();
		void loadReport();
	}, [loadNotice, loadReport]);

	async function handleSave(e: FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError("");
		setSaved(false);
		try {
			const res = await adminFetch(password, "/status-notice", {
				method: "PUT",
				body: JSON.stringify({ enabled, message }),
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json()) as BannerState & { error?: string };
			if (!res.ok) {
				setError(data.error || "Couldn't save status notice.");
				return;
			}
			setEnabled(Boolean(data.enabled));
			setMessage(data.message ?? "");
			setSaved(true);
			void loadReport();
		} catch {
			setError("Couldn't save status notice.");
		} finally {
			setSaving(false);
		}
	}

	const overallLabel =
		report?.overall === "outage"
			? "Service disruption"
			: report?.overall === "degraded"
				? "Partial disruption"
				: "All systems operational";

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="font-display text-2xl font-semibold text-violet-50">Status / uptime</p>
					<p className="mt-1 text-sm text-violet-300/60">
						Live health checks and the public message shown on the status page.
					</p>
				</div>
				<a
					href="/status"
					target="_blank"
					rel="noreferrer"
					className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-violet-500/25 px-3 py-2 text-sm text-violet-100 transition hover:border-violet-400/40"
				>
					Open status page
					<ExternalLinkIcon className="size-3.5" />
				</a>
			</div>

			<section className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Live snapshot</h2>
					<button
						type="button"
						onClick={() => void loadReport()}
						disabled={reportLoading}
						className="cursor-pointer rounded-lg border border-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:border-violet-400/40 disabled:opacity-50"
					>
						{reportLoading ? "Refreshing…" : "Refresh"}
					</button>
				</div>
				{reportLoading && !report ? (
					<div className="flex justify-center py-10">
						<SpinnerIcon className="size-5 text-violet-400" />
					</div>
				) : report ? (
					<div className="space-y-4">
						<div className="flex flex-wrap items-center gap-3">
							<span
								className={`size-2.5 rounded-full ${
									report.overall === "outage"
										? "bg-rose-400"
										: report.overall === "degraded"
											? "bg-amber-300"
											: "bg-emerald-400"
								}`}
							/>
							<p className="text-sm font-medium text-violet-50">{overallLabel}</p>
							<p className="text-xs text-violet-400/50">Checked {formatDate(report.checkedAt)}</p>
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-xl border border-violet-500/10 bg-white/[0.02] px-3 py-3">
								<p className="text-[11px] text-violet-400/50 uppercase">Uptime (30d)</p>
								<p className="mt-1 font-display text-xl font-semibold text-violet-50">
									{report.uptime.percent != null ? `${report.uptime.percent.toFixed(2)}%` : "-"}
								</p>
							</div>
							<div className="rounded-xl border border-violet-500/10 bg-white/[0.02] px-3 py-3">
								<p className="text-[11px] text-violet-400/50 uppercase">Checks</p>
								<p className="mt-1 font-display text-xl font-semibold text-violet-50">
									{report.uptime.okCount}/{report.uptime.sampleCount}
								</p>
							</div>
							<div className="rounded-xl border border-violet-500/10 bg-white/[0.02] px-3 py-3">
								<p className="text-[11px] text-violet-400/50 uppercase">Components</p>
								<p className="mt-1 text-sm text-violet-200/80">
									{report.components.map((c) => c.name).join(" · ")}
								</p>
							</div>
						</div>
						<UptimeBar days={report.uptime.days ?? []} windowDays={report.uptime.windowDays ?? 30} compact />
					</div>
				) : (
					<p className="text-sm text-rose-300">Couldn't load live status.</p>
				)}
			</section>

			<section className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
				<h2 className="text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Status page message</h2>
				<p className="mt-1 text-sm text-violet-300/55">
					Shown as a notice on <code className="text-violet-200/80">/status</code>. Use this for incidents or
					maintenance, for example &quot;Currently down for database maintenance.&quot;
				</p>

				{noticeLoading ? (
					<div className="mt-6 flex justify-center py-8">
						<SpinnerIcon className="size-5 text-violet-400" />
					</div>
				) : (
					<form onSubmit={(e) => void handleSave(e)} className="mt-5 space-y-4">
						<label className="flex cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								checked={enabled}
								onChange={(e) => setEnabled(e.target.checked)}
								className="size-4 cursor-pointer rounded border-violet-500/40"
							/>
							<span className="text-sm font-medium text-violet-100">Show message on status page</span>
						</label>
						<label className="block">
							<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Message</span>
							<textarea
								rows={4}
								maxLength={1000}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Currently down for reason X…"
								className="w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50 outline-none placeholder:text-violet-400/40 focus:border-violet-400/50"
							/>
							<p className="mt-1 text-[11px] text-violet-400/45">{message.length}/1000</p>
						</label>
						{enabled && message.trim() ? (
							<div className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-50">
								<AlertIcon className="mt-0.5 size-4 shrink-0 text-amber-200/90" />
								<p className="min-w-0 whitespace-pre-wrap">{message.trim()}</p>
							</div>
						) : null}
						{error && <p className="text-sm text-rose-300">{error}</p>}
						{saved && !error && <p className="text-sm text-emerald-300">Saved. Visible on the status page now.</p>}
						<button
							type="submit"
							disabled={saving}
							className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
						>
							{saving ? <SpinnerIcon className="size-4" /> : <CheckIcon className="size-4" />}
							{saving ? "Saving…" : "Save status message"}
						</button>
					</form>
				)}
			</section>
		</div>
	);
}

function WaitlistTab({ password, onUnauthorized }: { password: string; onUnauthorized: () => void }) {
	const [rows, setRows] = useState<Registration[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState<Sort>("newest");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [exporting, setExporting] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<Registration | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);
	const [actionError, setActionError] = useState("");

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(t);
	}, [search]);

	const pageResetKey = `${sort}\0${debouncedSearch}`;
	const [pageResetSource, setPageResetSource] = useState(pageResetKey);
	if (pageResetKey !== pageResetSource) {
		setPageResetSource(pageResetKey);
		setPage(1);
	}

	const fetchKey = `${page}\0${sort}\0${debouncedSearch}\0${reloadToken}`;
	const [fetchKeySource, setFetchKeySource] = useState(fetchKey);
	if (fetchKey !== fetchKeySource) {
		setFetchKeySource(fetchKey);
		setLoading(true);
	}

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const params = new URLSearchParams({
					page: String(page),
					pageSize: String(PAGE_SIZE),
					sort: sort === "oldest" ? "oldest" : "newest",
				});
				if (debouncedSearch) params.set("q", debouncedSearch);

				const res = await adminFetch(password, `/registrations?${params.toString()}`);
				if (cancelled) return;
				if (res.status === 401) {
					onUnauthorized();
					return;
				}
				if (!res.ok) throw new Error("Failed to load");
				const data = (await res.json()) as { rows: Registration[]; total: number };
				if (cancelled) return;
				setRows(data.rows);
				setTotal(data.total);
				setError("");
			} catch {
				if (!cancelled) setError("Couldn't load registrations. Try refreshing.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [page, sort, debouncedSearch, reloadToken, password, onUnauthorized]);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	async function handleExport() {
		setExporting(true);
		setError("");
		try {
			const params = new URLSearchParams({ sort: sort === "oldest" ? "oldest" : "newest" });
			if (debouncedSearch) params.set("q", debouncedSearch);

			const res = await adminFetch(password, `/registrations/export?${params.toString()}`);
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			if (!res.ok) throw new Error("Failed to export");

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `lumantic-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch {
			setError("Couldn't export emails. Try again.");
		} finally {
			setExporting(false);
		}
	}

	async function deleteRegistration() {
		if (!pendingDelete) return;
		setDeleting(true);
		setActionError("");
		try {
			const res = await adminFetch(password, `/registrations/${pendingDelete.id}`, { method: "DELETE" });
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as { error?: string } | null;
				throw new Error(data?.error ?? "Failed to delete");
			}
			setPendingDelete(null);
			if (rows.length === 1 && page > 1) {
				setPage((p) => Math.max(1, p - 1));
			} else {
				setReloadToken((n) => n + 1);
			}
		} catch (err) {
			setActionError(err instanceof Error ? err.message : "Couldn't remove that email. Try again.");
			setPendingDelete(null);
		} finally {
			setDeleting(false);
		}
	}

	return (
		<div>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<p className="font-display text-2xl font-semibold text-violet-50">
						{total}{" "}
						<span className="text-base font-normal text-violet-300/60">
							registered {total === 1 ? "email" : "emails"}
						</span>
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<div className="relative">
						<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-400/50" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search email…"
							className="w-52 rounded-lg border border-violet-500/20 bg-white/[0.03] py-2 pr-3 pl-9 text-sm text-violet-50 transition outline-none placeholder:text-violet-400/40 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
						/>
					</div>

					<Select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
						<option value="newest" className="bg-ink">
							Newest first
						</option>
						<option value="oldest" className="bg-ink">
							Oldest first
						</option>
					</Select>

					<button
						onClick={handleExport}
						disabled={exporting || total === 0}
						className="flex cursor-pointer items-center gap-2 rounded-lg border border-violet-500/20 px-3.5 py-2 text-sm text-violet-300/70 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{exporting ? <SpinnerIcon className="size-4" /> : <DownloadIcon className="size-4" />}
						{exporting ? "Exporting…" : "Download CSV"}
					</button>
				</div>
			</div>

			{actionError ? <p className="mb-4 text-sm text-rose-300">{actionError}</p> : null}

			<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02]">
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="border-b border-violet-500/10 text-xs tracking-wide text-violet-400/60 uppercase">
							<th className="px-5 py-3.5 font-medium">Email</th>
							<th className="px-5 py-3.5 font-medium">Registered</th>
							<th className="px-5 py-3.5 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={3} className="px-5 py-14 text-center text-violet-300/50">
									<SpinnerIcon className="mx-auto size-5" />
								</td>
							</tr>
						) : error ? (
							<tr>
								<td colSpan={3} className="px-5 py-14 text-center text-rose-300">
									{error}
								</td>
							</tr>
						) : rows.length === 0 ? (
							<tr>
								<td colSpan={3} className="px-5 py-14 text-center text-violet-300/50">
									No registrations {debouncedSearch ? "match your search" : "yet"}.
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr
									key={row.id}
									className="border-b border-violet-500/5 transition last:border-0 hover:bg-white/[0.02]"
								>
									<td className="px-5 py-3.5 text-violet-100">{row.email}</td>
									<td className="px-5 py-3.5 font-mono text-xs text-violet-300/60">{formatDate(row.created_at)}</td>
									<td className="px-5 py-3.5 text-right">
										<div className="inline-flex items-center justify-end gap-0.5">
											<Tooltip content={`Email ${row.email}`}>
												<a
													href={`mailto:${row.email}`}
													aria-label={`Email ${row.email}`}
													className="inline-flex size-8 items-center justify-center rounded-full text-violet-300/70 transition hover:bg-violet-500/15 hover:text-violet-100"
												>
													<MailIcon />
												</a>
											</Tooltip>
											<Tooltip content={`Remove ${row.email}`}>
												<button
													type="button"
													onClick={() => setPendingDelete(row)}
													aria-label={`Remove ${row.email}`}
													className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-violet-300/70 transition hover:bg-rose-500/15 hover:text-rose-300"
												>
													<TrashIcon className="size-3.5" />
												</button>
											</Tooltip>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<div className="mt-6 flex items-center justify-between text-sm text-violet-300/60">
				<p>
					Page {page} of {totalPages}
				</p>
				<div className="flex items-center gap-2">
					<Tooltip content="Previous page">
						<span className="inline-flex">
							<button
								type="button"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page <= 1}
								aria-label="Previous page"
								className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-violet-500/20 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
							>
								<ChevronLeft />
							</button>
						</span>
					</Tooltip>
					<Tooltip content="Next page">
						<span className="inline-flex">
							<button
								type="button"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page >= totalPages}
								aria-label="Next page"
								className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-violet-500/20 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
							>
								<ChevronRight />
							</button>
						</span>
					</Tooltip>
				</div>
			</div>

			{pendingDelete ? (
				<ConfirmModal
					title="Remove from waitlist?"
					description={`Remove ${pendingDelete.email} from the email waitlist? They can register again later.`}
					confirmLabel="Remove"
					tone="danger"
					busy={deleting}
					onClose={() => {
						if (!deleting) setPendingDelete(null);
					}}
					onConfirm={() => void deleteRegistration()}
				/>
			) : null}
		</div>
	);
}

function ImpersonateModal({
	password,
	member,
	workspaceName,
	onClose,
	onUnauthorized,
}: {
	password: string;
	member: WorkspaceMember;
	workspaceName: string;
	onClose: () => void;
	onUnauthorized: () => void;
}) {
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setError("");
		try {
			const res = await adminFetch(password, "/impersonate", {
				method: "POST",
				body: JSON.stringify({ memberId: member.id, reason: reason.trim() }),
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json().catch(() => null)) as
				| { ok?: boolean; token?: string; error?: string }
				| null;
			if (!res.ok || !data?.token) {
				setError(data?.error ?? "Couldn't start session.");
				return;
			}
			localStorage.setItem("lumantic_app_token", data.token);
			window.open("/app", "_blank", "noopener,noreferrer");
			onClose();
		} catch {
			setError("Couldn't start session. Try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close"
				className="absolute inset-0 cursor-pointer bg-black/60"
				onClick={onClose}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="impersonate-title"
				className="relative z-10 w-full max-w-md rounded-2xl border border-violet-500/20 bg-ink p-5 shadow-2xl"
			>
				<h3 id="impersonate-title" className="font-display text-lg font-semibold text-violet-50">
					Log in as user
				</h3>
				<p className="mt-1 text-sm text-violet-300/70">
					Open the product as {member.name} ({member.email}) in {workspaceName}.
				</p>
				<p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
					This action is tracked for internal audit. Your reason is stored with the session start
					event in Audit trail.
				</p>
				<form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
					<label className="block">
						<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Reason</span>
						<textarea
							required
							minLength={8}
							maxLength={500}
							rows={3}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Why are you opening this account? (support ticket, billing check, …)"
							className="w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50 outline-none placeholder:text-violet-400/40 focus:border-violet-400/50"
						/>
					</label>
					{error && <p className="text-sm text-rose-300">{error}</p>}
					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={onClose}
							className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:bg-white/[0.04] hover:text-violet-100"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting || reason.trim().length < 8}
							className="flex cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{submitting ? <SpinnerIcon className="size-4" /> : <ExternalLinkIcon className="size-4" />}
							Open as user
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function CustomerRowMenu({
	workspace,
	onAction,
}: {
	workspace: Workspace;
	onAction: (action: "view" | "markOverdue" | "markActive" | "copyContact" | "delete") => void;
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

	const items: { action: "view" | "markOverdue" | "markActive" | "copyContact" | "delete"; label: string; icon: ReactNode; tone?: "rose" }[] =
		[
			{
				action: "view",
				label: "View details",
				icon: <UsersIcon className="size-3.5" />,
			},
		];

	if (workspace.billingStatus === "overdue") {
		items.push({
			action: "markActive",
			label: "Mark bill paid",
			icon: <CreditCardIcon className="size-3.5" />,
		});
	} else if (workspace.billingStatus !== "canceled") {
		items.push({
			action: "markOverdue",
			label: "Mark bill unpaid",
			icon: <AlertIcon className="size-3.5" />,
		});
	}

	if (workspace.primaryContactEmail) {
		items.push({
			action: "copyContact",
			label: "Copy contact email",
			icon: <MailIcon className="size-3.5" />,
		});
	}

	if (!workspace.isLive) {
		items.push({
			action: "delete",
			label: "Delete customer",
			icon: <TrashIcon className="size-3.5" />,
			tone: "rose",
		});
	}

	return (
		<div ref={rootRef} className="relative shrink-0">
			<Tooltip content="Customer actions">
				<button
					type="button"
					aria-label={`Actions for ${workspace.name}`}
					aria-expanded={open}
					onClick={(e) => {
						e.stopPropagation();
						setOpen((v) => !v);
					}}
					className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-violet-400/50 transition hover:bg-white/[0.06] hover:text-violet-100"
				>
					<MoreHorizontalIcon className="size-4" />
				</button>
			</Tooltip>
			{open && (
				<div
					role="menu"
					className="absolute top-9 right-0 z-50 min-w-[12.5rem] rounded-xl border border-violet-500/20 bg-ink py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]"
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
							className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-white/[0.05] ${
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

function DeleteCustomerModal({
	workspace,
	busy,
	error,
	onClose,
	onConfirm,
}: {
	workspace: Workspace;
	busy: boolean;
	error: string;
	onClose: () => void;
	onConfirm: (confirmation: string) => void;
}) {
	const [confirmation, setConfirmation] = useState("");
	const canDelete = confirmation.trim() === workspace.name;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close"
				className="absolute inset-0 cursor-pointer bg-black/60"
				onClick={onClose}
				disabled={busy}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="delete-customer-title"
				className="relative z-10 w-full max-w-md rounded-2xl border border-violet-500/20 bg-ink p-5 shadow-2xl"
			>
				<h3 id="delete-customer-title" className="font-display text-lg font-semibold text-violet-50">
					Delete customer?
				</h3>
				<p className="mt-2 text-sm leading-relaxed text-violet-200/80">
					This permanently removes <strong className="font-semibold text-violet-50">{workspace.name}</strong> and
					all of its users from admin. Type{" "}
					<strong className="font-semibold text-violet-50">{workspace.name}</strong> to confirm.
				</p>
				<label className="mt-4 block">
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Customer name</span>
					<input
						value={confirmation}
						onChange={(e) => setConfirmation(e.target.value)}
						autoFocus
						autoComplete="off"
						spellCheck={false}
						placeholder={workspace.name}
						disabled={busy}
						className="w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50 outline-none placeholder:text-violet-400/40 focus:border-violet-400/50"
					/>
				</label>
				{error ? (
					<p className="mt-3 flex items-center gap-1.5 text-sm text-rose-300">
						<AlertIcon className="size-4 shrink-0" />
						{error}
					</p>
				) : null}
				<div className="mt-5 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						disabled={busy}
						className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:bg-white/[0.04] hover:text-violet-100 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!canDelete || busy}
						onClick={() => onConfirm(confirmation.trim())}
						className="flex cursor-pointer items-center gap-2 rounded-lg bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{busy ? <SpinnerIcon className="size-4" /> : <TrashIcon className="size-4" />}
						Delete customer
					</button>
				</div>
			</div>
		</div>
	);
}

function WorkspacesTab({ password, onUnauthorized }: { password: string; onUnauthorized: () => void }) {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<"" | WorkspaceBillingStatus>("");
	const [planFilter, setPlanFilter] = useState<"" | WorkspacePlanId>("");
	const [selectedId, setSelectedId] = useState<number | null>(() => {
		if (typeof window === "undefined") return null;
		return readAdminLocation().customerId;
	});

	useEffect(() => {
		function onPopState() {
			const loc = parseAdminPath(window.location.pathname);
			if (loc.tab !== "workspaces") return;
			setSelectedId(loc.customerId);
			if (loc.customerId == null) {
				setDetail(null);
				setDraft(null);
				setFormError("");
			}
		}
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);
	const [detail, setDetail] = useState<{ workspace: Workspace; members: WorkspaceMember[] } | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [addingUser, setAddingUser] = useState(false);
	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newRole, setNewRole] = useState("Member");
	const [formError, setFormError] = useState("");
	const [impersonateMember, setImpersonateMember] = useState<WorkspaceMember | null>(null);
	const [pendingRemove, setPendingRemove] = useState<WorkspaceMember | null>(null);
	const [removing, setRemoving] = useState(false);
	const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState<Workspace | null>(null);
	const [deletingCustomer, setDeletingCustomer] = useState(false);
	const [deleteCustomerError, setDeleteCustomerError] = useState("");
	const [menuNotice, setMenuNotice] = useState("");
	const [draft, setDraft] = useState<{
		planId: WorkspacePlanId;
		billingStatus: WorkspaceBillingStatus;
		renewsAt: string;
		seatLimit: string;
		mrrCents: string;
		primaryContactEmail: string;
		notes: string;
	} | null>(null);

	const loadList = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (search.trim()) params.set("q", search.trim());
			if (statusFilter) params.set("status", statusFilter);
			if (planFilter) params.set("plan", planFilter);
			const res = await adminFetch(password, `/workspaces?${params.toString()}`);
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			if (!res.ok) throw new Error("Failed");
			const data = (await res.json()) as { workspaces: Workspace[] };
			setWorkspaces(data.workspaces);
			setError("");
		} catch {
			setError("Couldn't load customers.");
		} finally {
			setLoading(false);
		}
	}, [password, onUnauthorized, search, statusFilter, planFilter]);

	useEffect(() => {
		const t = setTimeout(() => {
			void loadList();
		}, 200);
		return () => clearTimeout(t);
	}, [loadList]);

	useEffect(() => {
		if (selectedId == null) {
			setDetail(null);
			setDraft(null);
			return;
		}
		let cancelled = false;
		setDetailLoading(true);
		(async () => {
			try {
				const res = await adminFetch(password, `/workspaces/${selectedId}`);
				if (cancelled) return;
				if (res.status === 401) {
					onUnauthorized();
					return;
				}
				if (!res.ok) throw new Error("Failed");
				const data = (await res.json()) as { workspace: Workspace; members: WorkspaceMember[] };
				if (cancelled) return;
				setDetail(data);
				setDraft({
					planId: (WORKSPACE_PLAN_IDS.includes(data.workspace.planId as WorkspacePlanId)
						? data.workspace.planId
						: "starter") as WorkspacePlanId,
					billingStatus: (WORKSPACE_BILLING_STATUSES.includes(
						data.workspace.billingStatus as WorkspaceBillingStatus,
					)
						? data.workspace.billingStatus
						: "active") as WorkspaceBillingStatus,
					renewsAt: data.workspace.renewsAt ?? "",
					seatLimit: String(data.workspace.seatLimit),
					mrrCents: String(data.workspace.mrrCents),
					primaryContactEmail: data.workspace.primaryContactEmail ?? "",
					notes: data.workspace.notes ?? "",
				});
				setFormError("");
			} catch {
				if (!cancelled) setFormError("Couldn't load workspace detail.");
			} finally {
				if (!cancelled) setDetailLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [selectedId, password, onUnauthorized]);

	async function saveWorkspace() {
		if (!detail || !draft) return;
		setSaving(true);
		setFormError("");
		try {
			const res = await adminFetch(password, `/workspaces/${detail.workspace.id}`, {
				method: "PATCH",
				body: JSON.stringify({
					planId: draft.planId,
					billingStatus: draft.billingStatus,
					renewsAt: draft.renewsAt,
					seatLimit: Number(draft.seatLimit) || detail.workspace.seatLimit,
					mrrCents: Number(draft.mrrCents) || 0,
					primaryContactEmail: draft.primaryContactEmail,
					notes: draft.notes,
				}),
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json()) as { workspace?: Workspace; error?: string };
			if (!res.ok) {
				setFormError(data.error || "Couldn't save workspace.");
				return;
			}
			if (data.workspace) {
				setDetail((prev) => (prev ? { ...prev, workspace: data.workspace! } : prev));
				setWorkspaces((prev) => prev.map((w) => (w.id === data.workspace!.id ? { ...w, ...data.workspace! } : w)));
			}
		} catch {
			setFormError("Couldn't save workspace.");
		} finally {
			setSaving(false);
		}
	}

	async function addUser(e: React.FormEvent) {
		e.preventDefault();
		if (!detail) return;
		setAddingUser(true);
		setFormError("");
		try {
			const res = await adminFetch(password, `/workspaces/${detail.workspace.id}/members`, {
				method: "POST",
				body: JSON.stringify({ name: newName, email: newEmail, role: newRole }),
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json()) as { member?: WorkspaceMember; error?: string };
			if (!res.ok) {
				setFormError(data.error || "Couldn't add user.");
				return;
			}
			if (data.member) {
				setDetail((prev) =>
					prev
						? {
								...prev,
								members: [...prev.members, data.member!],
								workspace: { ...prev.workspace, userCount: prev.workspace.userCount + 1 },
							}
						: prev,
				);
				setWorkspaces((prev) =>
					prev.map((w) => (w.id === detail.workspace.id ? { ...w, userCount: w.userCount + 1 } : w)),
				);
				setNewName("");
				setNewEmail("");
				setNewRole("Member");
			}
		} catch {
			setFormError("Couldn't add user.");
		} finally {
			setAddingUser(false);
		}
	}

	async function removeMember(member: WorkspaceMember) {
		if (!detail) return;
		setRemoving(true);
		setFormError("");
		try {
			const res = await adminFetch(password, `/workspaces/${detail.workspace.id}/members/${member.id}`, {
				method: "DELETE",
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json()) as { error?: string };
			if (!res.ok) {
				setFormError(data.error || "Couldn't remove user.");
				return;
			}
			setDetail((prev) =>
				prev
					? {
							...prev,
							members: prev.members.filter((m) => m.id !== member.id),
							workspace: { ...prev.workspace, userCount: Math.max(0, prev.workspace.userCount - 1) },
						}
					: prev,
			);
			setWorkspaces((prev) =>
				prev.map((w) =>
					w.id === detail.workspace.id ? { ...w, userCount: Math.max(0, w.userCount - 1) } : w,
				),
			);
			setPendingRemove(null);
		} catch {
			setFormError("Couldn't remove user.");
		} finally {
			setRemoving(false);
		}
	}

	useEffect(() => {
		if (!menuNotice) return;
		const t = setTimeout(() => setMenuNotice(""), 2500);
		return () => clearTimeout(t);
	}, [menuNotice]);

	async function setBillingStatusQuick(workspace: Workspace, billingStatus: WorkspaceBillingStatus) {
		try {
			const res = await adminFetch(password, `/workspaces/${workspace.id}`, {
				method: "PATCH",
				body: JSON.stringify({ billingStatus }),
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json()) as { workspace?: Workspace; error?: string };
			if (!res.ok || !data.workspace) {
				setMenuNotice(data.error || "Couldn't update billing status.");
				return;
			}
			setWorkspaces((prev) => prev.map((w) => (w.id === data.workspace!.id ? { ...w, ...data.workspace! } : w)));
			setDetail((prev) =>
				prev && prev.workspace.id === data.workspace!.id
					? { ...prev, workspace: { ...prev.workspace, ...data.workspace! } }
					: prev,
			);
			if (draft && selectedId === data.workspace.id) {
				setDraft((prev) => (prev ? { ...prev, billingStatus: data.workspace!.billingStatus as WorkspaceBillingStatus } : prev));
			}
			setMenuNotice(
				billingStatus === "overdue"
					? `Marked ${workspace.name} unpaid.`
					: `Marked ${workspace.name} paid.`,
			);
		} catch {
			setMenuNotice("Couldn't update billing status.");
		}
	}

	async function deleteCustomer(confirmation: string) {
		if (!pendingDeleteCustomer) return;
		setDeletingCustomer(true);
		setDeleteCustomerError("");
		try {
			const res = await adminFetch(password, `/workspaces/${pendingDeleteCustomer.id}`, {
				method: "DELETE",
				body: JSON.stringify({ confirmation }),
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json()) as { error?: string };
			if (!res.ok) {
				setDeleteCustomerError(data.error || "Couldn't delete customer.");
				return;
			}
			const deletedId = pendingDeleteCustomer.id;
			const deletedName = pendingDeleteCustomer.name;
			setWorkspaces((prev) => prev.filter((w) => w.id !== deletedId));
			if (selectedId === deletedId) {
				setSelectedId(null);
				setDetail(null);
				setDraft(null);
				window.history.replaceState({}, "", adminPath("workspaces"));
			}
			setPendingDeleteCustomer(null);
			setMenuNotice(`Deleted customer ${deletedName}.`);
		} catch {
			setDeleteCustomerError("Couldn't delete customer.");
		} finally {
			setDeletingCustomer(false);
		}
	}

	function openCustomer(id: number) {
		setSelectedId(id);
		window.history.pushState({}, "", adminPath("workspaces", id));
	}

	function closeCustomer() {
		setSelectedId(null);
		setDetail(null);
		setDraft(null);
		setFormError("");
		window.history.pushState({}, "", adminPath("workspaces"));
	}

	function handleCustomerMenuAction(
		workspace: Workspace,
		action: "view" | "markOverdue" | "markActive" | "copyContact" | "delete",
	) {
		if (action === "view") {
			openCustomer(workspace.id);
			return;
		}
		if (action === "markOverdue") {
			void setBillingStatusQuick(workspace, "overdue");
			return;
		}
		if (action === "markActive") {
			void setBillingStatusQuick(workspace, "active");
			return;
		}
		if (action === "copyContact") {
			const email = workspace.primaryContactEmail;
			if (!email) return;
			void navigator.clipboard.writeText(email).then(
				() => setMenuNotice(`Copied ${email}`),
				() => setMenuNotice("Couldn't copy email."),
			);
			return;
		}
		setDeleteCustomerError("");
		setPendingDeleteCustomer(workspace);
	}

	const deleteModal = pendingDeleteCustomer ? (
		<DeleteCustomerModal
			workspace={pendingDeleteCustomer}
			busy={deletingCustomer}
			error={deleteCustomerError}
			onClose={() => {
				if (!deletingCustomer) {
					setPendingDeleteCustomer(null);
					setDeleteCustomerError("");
				}
			}}
			onConfirm={(confirmation) => void deleteCustomer(confirmation)}
		/>
	) : null;

	if (selectedId != null) {
		return (
			<div>
				<button
					type="button"
					onClick={closeCustomer}
					className="mb-6 flex cursor-pointer items-center gap-1.5 text-sm text-violet-300/70 transition hover:text-violet-50"
				>
					<ChevronLeft className="size-4" />
					Customers
				</button>

				{detailLoading || !detail || !draft ? (
					<div className="flex justify-center py-24">
						<SpinnerIcon className="size-5 text-violet-400" />
					</div>
				) : (
					<div className="space-y-8">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<h2 className="font-display text-2xl font-semibold text-violet-50">{detail.workspace.name}</h2>
									{detail.workspace.isLive && (
										<span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-200">
											Powers /app
										</span>
									)}
									<span
										className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone(detail.workspace.billingStatus)}`}
									>
										{billingStatusLabel(detail.workspace.billingStatus)}
									</span>
								</div>
								<p className="mt-1 text-sm text-violet-400/55">{detail.workspace.slug}</p>
								{detail.workspace.billingStatus === "overdue" && (
									<p className="mt-2 flex items-start gap-1.5 text-sm text-rose-300/90">
										<AlertIcon className="mt-0.5 size-4 shrink-0" />
										Overdue since {formatDay(detail.workspace.overdueSince)}
									</p>
								)}
							</div>
							{!detail.workspace.isLive ? (
								<button
									type="button"
									onClick={() => {
										setDeleteCustomerError("");
										setPendingDeleteCustomer(detail.workspace);
									}}
									className="flex cursor-pointer items-center gap-2 rounded-lg border border-rose-500/25 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10"
								>
									<TrashIcon className="size-4" />
									Delete customer
								</button>
							) : null}
						</div>

						<div className="grid gap-6 lg:grid-cols-2">
							<section className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
								<h3 className="text-xs font-semibold tracking-wide text-violet-300/70 uppercase">
									Plan & billing
								</h3>
								<div className="mt-4 grid grid-cols-2 gap-3">
									<label className="block text-xs text-violet-400/60">
										Plan
										<Select
											value={draft.planId}
											onChange={(e) => setDraft({ ...draft, planId: e.target.value as WorkspacePlanId })}
											wrapperClassName="mt-1.5 w-full"
										>
											{WORKSPACE_PLAN_IDS.map((p) => (
												<option key={p} value={p} className="bg-ink">
													{planLabel(p)}
												</option>
											))}
										</Select>
									</label>
									<label className="block text-xs text-violet-400/60">
										Billing status
										<Select
											value={draft.billingStatus}
											onChange={(e) =>
												setDraft({ ...draft, billingStatus: e.target.value as WorkspaceBillingStatus })
											}
											wrapperClassName="mt-1.5 w-full"
										>
											{WORKSPACE_BILLING_STATUSES.map((s) => (
												<option key={s} value={s} className="bg-ink">
													{billingStatusLabel(s)}
												</option>
											))}
										</Select>
									</label>
									<label className="block text-xs text-violet-400/60">
										Renews
										<DatePicker
											value={draft.renewsAt ? draft.renewsAt.slice(0, 10) : ""}
											onChange={(next) => setDraft({ ...draft, renewsAt: next })}
											wrapperClassName="mt-1.5 w-full"
											aria-label="Renews"
										/>
									</label>
									<label className="block text-xs text-violet-400/60">
										Seat limit
										<input
											type="number"
											min={1}
											value={draft.seatLimit}
											onChange={(e) => setDraft({ ...draft, seatLimit: e.target.value })}
											className="mt-1.5 w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50"
										/>
									</label>
									<label className="col-span-2 block text-xs text-violet-400/60">
										MRR (cents)
										<input
											type="number"
											min={0}
											value={draft.mrrCents}
											onChange={(e) => setDraft({ ...draft, mrrCents: e.target.value })}
											className="mt-1.5 w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50"
										/>
									</label>
									<label className="col-span-2 block text-xs text-violet-400/60">
										Primary contact
										<input
											type="email"
											value={draft.primaryContactEmail}
											onChange={(e) => setDraft({ ...draft, primaryContactEmail: e.target.value })}
											className="mt-1.5 w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50"
										/>
									</label>
									<label className="col-span-2 block text-xs text-violet-400/60">
										Admin notes
										<textarea
											rows={4}
											value={draft.notes}
											onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
											className="mt-1.5 w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50"
										/>
									</label>
								</div>
								<button
									type="button"
									onClick={() => void saveWorkspace()}
									disabled={saving}
									className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
								>
									{saving ? <SpinnerIcon className="size-4" /> : <CheckIcon className="size-4" />}
									Save customer
								</button>
								{formError ? <p className="mt-3 text-sm text-rose-300">{formError}</p> : null}
							</section>

							<section className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
								<h3 className="text-xs font-semibold tracking-wide text-violet-300/70 uppercase">
									Users ({detail.members.length})
								</h3>
								<ul className="mt-4 max-h-[22rem] space-y-2 overflow-y-auto">
									{detail.members.map((m) => (
										<li
											key={m.id}
											className="flex items-start justify-between gap-2 rounded-lg border border-violet-500/10 bg-white/[0.02] px-3 py-2.5"
										>
											<div className="min-w-0">
												<p className="truncate text-sm text-violet-50">{m.name}</p>
												<p className="truncate text-xs text-violet-400/55">{m.email}</p>
												<p className="mt-0.5 text-[11px] text-violet-400/45">
													{m.role} · {m.status}
												</p>
											</div>
											<div className="flex shrink-0 items-center gap-0.5">
												{m.status !== "disabled" && (
													<Tooltip content={`Log in as ${m.name}`}>
														<button
															type="button"
															onClick={() => setImpersonateMember(m)}
															aria-label={`Log in as ${m.name}`}
															className="cursor-pointer rounded-md p-1.5 text-violet-400/50 transition hover:bg-violet-500/15 hover:text-violet-100"
														>
															<LogInIcon className="size-3.5" />
														</button>
													</Tooltip>
												)}
												{m.role !== "Owner" && !m.is_you ? (
													<Tooltip content={`Remove ${m.name}`}>
														<button
															type="button"
															onClick={() => setPendingRemove(m)}
															aria-label={`Remove ${m.name}`}
															className="cursor-pointer rounded-md p-1.5 text-violet-400/50 transition hover:bg-rose-500/15 hover:text-rose-300"
														>
															<TrashIcon className="size-3.5" />
														</button>
													</Tooltip>
												) : null}
											</div>
										</li>
									))}
								</ul>

								<form onSubmit={addUser} className="mt-5 space-y-2.5 border-t border-violet-500/10 pt-5">
									<p className="text-xs font-semibold tracking-wide text-violet-300/70 uppercase">Add user</p>
									<input
										value={newName}
										onChange={(e) => setNewName(e.target.value)}
										placeholder="Name (optional)"
										className="w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50 outline-none"
									/>
									<input
										required
										type="email"
										value={newEmail}
										onChange={(e) => setNewEmail(e.target.value)}
										placeholder="Email"
										className="w-full rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-sm text-violet-50 outline-none"
									/>
									<Select
										value={newRole}
										onChange={(e) => setNewRole(e.target.value)}
										wrapperClassName="w-full"
										aria-label="Role"
									>
										<option value="Member" className="bg-ink">
											Member
										</option>
										<option value="Admin" className="bg-ink">
											Admin
										</option>
										<option value="Owner" className="bg-ink">
											Owner
										</option>
									</Select>
									<button
										type="submit"
										disabled={addingUser || !newEmail.trim()}
										className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-violet-500/25 px-3 py-2.5 text-sm text-violet-100 transition hover:border-violet-400/40 disabled:opacity-50"
									>
										{addingUser ? <SpinnerIcon className="size-4" /> : <PlusIcon className="size-4" />}
										Add user
									</button>
								</form>
							</section>
						</div>
					</div>
				)}

				{impersonateMember && detail && (
					<ImpersonateModal
						password={password}
						member={impersonateMember}
						workspaceName={detail.workspace.name}
						onClose={() => setImpersonateMember(null)}
						onUnauthorized={onUnauthorized}
					/>
				)}

				{pendingRemove && detail && (
					<ConfirmModal
						title="Remove user?"
						description={`Remove ${pendingRemove.name} from ${detail.workspace.name}?`}
						confirmLabel="Remove"
						tone="danger"
						busy={removing}
						onClose={() => {
							if (!removing) setPendingRemove(null);
						}}
						onConfirm={() => void removeMember(pendingRemove)}
					/>
				)}

				{deleteModal}
			</div>
		);
	}

	return (
		<div>
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="relative min-w-[12rem] flex-1">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-400/50" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search customers…"
						className="w-full rounded-lg border border-violet-500/20 bg-white/[0.03] py-2 pr-3 pl-9 text-sm text-violet-50 outline-none placeholder:text-violet-400/40 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
					/>
				</div>
				<Select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value as "" | WorkspaceBillingStatus)}
					wrapperClassName="min-w-[9.5rem]"
					aria-label="Status"
				>
					<option value="" className="bg-ink">
						All statuses
					</option>
					{WORKSPACE_BILLING_STATUSES.map((s) => (
						<option key={s} value={s} className="bg-ink">
							{billingStatusLabel(s)}
						</option>
					))}
				</Select>
				<Select
					value={planFilter}
					onChange={(e) => setPlanFilter(e.target.value as "" | WorkspacePlanId)}
					wrapperClassName="min-w-[9.5rem]"
					aria-label="Plan"
				>
					<option value="" className="bg-ink">
						All plans
					</option>
					{WORKSPACE_PLAN_IDS.map((p) => (
						<option key={p} value={p} className="bg-ink">
							{planLabel(p)}
						</option>
					))}
				</Select>
			</div>

			{menuNotice ? (
				<p className="mb-3 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
					{menuNotice}
				</p>
			) : null}

			<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02]">
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="border-b border-violet-500/10 text-xs tracking-wide text-violet-400/60 uppercase">
							<th className="px-4 py-3 font-medium">Customer</th>
							<th className="px-4 py-3 font-medium">Plan</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Users</th>
							<th className="px-4 py-3 font-medium">MRR</th>
							<th className="px-2 py-3 font-medium">
								<span className="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={6} className="px-4 py-12 text-center">
									<SpinnerIcon className="mx-auto size-5 text-violet-400" />
								</td>
							</tr>
						) : error ? (
							<tr>
								<td colSpan={6} className="px-4 py-12 text-center text-rose-300">
									{error}
								</td>
							</tr>
						) : workspaces.length === 0 ? (
							<tr>
								<td colSpan={6} className="px-4 py-12 text-center text-violet-300/50">
									No customers match.
								</td>
							</tr>
						) : (
							workspaces.map((w) => (
								<tr
									key={w.id}
									onClick={() => openCustomer(w.id)}
									className="cursor-pointer border-b border-violet-500/5 last:border-0 hover:bg-white/[0.03]"
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<span className="font-medium text-violet-50">{w.name}</span>
											{w.isLive && (
												<span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-1.5 py-px text-[10px] font-semibold text-violet-200">
													Live
												</span>
											)}
										</div>
										<p className="text-xs text-violet-400/50">{w.slug}</p>
									</td>
									<td className="px-4 py-3 text-violet-200/80">{planLabel(w.planId)}</td>
									<td className="px-4 py-3">
										<span
											className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone(w.billingStatus)}`}
										>
											{billingStatusLabel(w.billingStatus)}
										</span>
									</td>
									<td className="px-4 py-3 tabular-nums text-violet-200/80">
										{w.userCount}/{w.seatLimit}
									</td>
									<td className="px-4 py-3 tabular-nums text-violet-200/80">{formatMrrCents(w.mrrCents)}</td>
									<td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
										<CustomerRowMenu
											workspace={w}
											onAction={(action) => handleCustomerMenuAction(w, action)}
										/>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{deleteModal}
		</div>
	);
}

function SupportTab({ password, onUnauthorized }: { password: string; onUnauthorized: () => void }) {
	const [tickets, setTickets] = useState<SupportTicket[]>([]);
	const [employees, setEmployees] = useState<AdminEmployee[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [ticketsRes, employeesRes] = await Promise.all([
				adminFetch(password, "/support-tickets"),
				adminFetch(password, "/employees"),
			]);
			if (ticketsRes.status === 401 || employeesRes.status === 401) {
				onUnauthorized();
				return;
			}
			if (!ticketsRes.ok || !employeesRes.ok) throw new Error("Failed");
			const ticketsData = (await ticketsRes.json()) as { tickets: SupportTicket[] };
			const employeesData = (await employeesRes.json()) as { employees: AdminEmployee[] };
			setTickets(ticketsData.tickets);
			setEmployees(employeesData.employees);
			setError("");
		} catch {
			setError("Couldn't load support tickets.");
		} finally {
			setLoading(false);
		}
	}, [password, onUnauthorized]);

	useEffect(() => {
		void load();
	}, [load]);

	async function patchTicket(id: number, body: { status?: "Open" | "Resolved"; ownerEmployeeId?: number | null }) {
		const res = await adminFetch(password, `/support-tickets/${id}`, {
			method: "PATCH",
			body: JSON.stringify(body),
		});
		if (res.status === 401) {
			onUnauthorized();
			return;
		}
		if (!res.ok) return;
		const data = (await res.json()) as { ticket: SupportTicket };
		setTickets((prev) => prev.map((t) => (t.id === id ? data.ticket : t)));
	}

	return (
		<div>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-sm text-violet-300/60">
					<LifeBuoyIcon className="size-4" />
					Customer support tickets from /app
				</div>
				{employees.length > 0 ? (
					<p className="text-xs text-violet-400/50">
						Employees: {employees.map((e) => e.name).join(", ")}
					</p>
				) : null}
			</div>
			<div className="space-y-3">
				{loading ? (
					<div className="flex justify-center py-16">
						<SpinnerIcon className="size-5 text-violet-400" />
					</div>
				) : error ? (
					<p className="py-10 text-center text-rose-300">{error}</p>
				) : tickets.length === 0 ? (
					<p className="py-10 text-center text-violet-300/50">No tickets yet.</p>
				) : (
					tickets.map((t) => (
						<article key={t.id} className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="text-xs text-violet-400/50">#{t.id}</p>
									<h3 className="mt-0.5 font-medium text-violet-50">{t.subject}</h3>
								</div>
								<span
									className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
										t.status === "Open"
											? "border-amber-500/25 bg-amber-500/15 text-amber-300"
											: "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
									}`}
								>
									{t.status}
								</span>
							</div>
							<p className="mt-2 text-sm text-violet-300/70">{t.message}</p>
							<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
								<div className="flex flex-wrap items-center gap-3">
									<p className="text-xs text-violet-400/45">{formatDate(t.created_at)}</p>
									<label className="flex items-center gap-2 text-xs text-violet-400/55">
										<span className="shrink-0">Owner</span>
										<Select
											size="sm"
											value={t.ownerEmployeeId == null ? "" : String(t.ownerEmployeeId)}
											onChange={(e) => {
												const raw = e.target.value;
												void patchTicket(t.id, {
													ownerEmployeeId: raw === "" ? null : Number(raw),
												});
											}}
											wrapperClassName="min-w-[8.5rem]"
											aria-label={`Owner for ticket ${t.id}`}
										>
											<option value="" className="bg-ink">
												Unassigned
											</option>
											{employees.map((emp) => (
												<option key={emp.id} value={emp.id} className="bg-ink">
													{emp.name}
												</option>
											))}
										</Select>
									</label>
								</div>
								{t.status === "Open" ? (
									<button
										type="button"
										onClick={() => void patchTicket(t.id, { status: "Resolved" })}
										className="cursor-pointer rounded-lg border border-violet-500/20 px-3 py-1.5 text-xs text-violet-200 transition hover:border-violet-400/40"
									>
										Mark resolved
									</button>
								) : (
									<button
										type="button"
										onClick={() => void patchTicket(t.id, { status: "Open" })}
										className="cursor-pointer rounded-lg border border-violet-500/20 px-3 py-1.5 text-xs text-violet-200 transition hover:border-violet-400/40"
									>
										Reopen
									</button>
								)}
							</div>
						</article>
					))
				)}
			</div>
		</div>
	);
}

function AuditTab({ password, onUnauthorized }: { password: string; onUnauthorized: () => void }) {
	const [rows, setRows] = useState<AuditEvent[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
		return () => window.clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams({
					page: String(page),
					pageSize: String(PAGE_SIZE),
				});
				if (debouncedSearch) params.set("q", debouncedSearch);
				const res = await adminFetch(password, `/audit?${params.toString()}`);
				if (cancelled) return;
				if (res.status === 401) {
					onUnauthorized();
					return;
				}
				if (!res.ok) throw new Error("Failed to load");
				const data = (await res.json()) as { rows: AuditEvent[]; total: number };
				if (cancelled) return;
				setRows(data.rows);
				setTotal(data.total);
				setError("");
			} catch {
				if (!cancelled) setError("Couldn't load audit trail. Try refreshing.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [page, debouncedSearch, password, onUnauthorized]);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div>
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-display text-2xl font-semibold text-violet-50">Audit trail</p>
					<p className="mt-1 text-sm text-violet-300/60">
						Internal log of admin actions, including log-in-as sessions and the reason given.
					</p>
				</div>
				<div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-400/50" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search actions, emails, reasons…"
						className="w-full rounded-lg border border-violet-500/20 bg-white/[0.03] py-2 pr-3 pl-9 text-sm text-violet-50 outline-none placeholder:text-violet-400/40"
					/>
				</div>
			</div>

			{error && <p className="mb-4 text-sm text-rose-300">{error}</p>}

			<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02]">
				{loading ? (
					<div className="flex justify-center py-16">
						<SpinnerIcon className="size-5 text-violet-400" />
					</div>
				) : rows.length === 0 ? (
					<p className="px-5 py-12 text-center text-sm text-violet-300/55">No audit events yet.</p>
				) : (
					<ul className="divide-y divide-violet-500/10">
						{rows.map((row) => (
							<li key={row.id} className="px-5 py-4">
								<div className="flex flex-wrap items-start justify-between gap-2">
									<div className="min-w-0">
										<p className="text-sm font-medium text-violet-50">{row.summary}</p>
										<p className="mt-1 text-xs text-violet-400/55">
											<code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-violet-200/80">
												{row.action}
											</code>
											{row.targetEmail ? ` · ${row.targetEmail}` : ""}
											{row.targetWorkspaceName ? ` · ${row.targetWorkspaceName}` : ""}
										</p>
										{row.reason && (
											<p className="mt-2 text-sm text-violet-200/75">
												<span className="text-violet-400/55">Reason: </span>
												{row.reason}
											</p>
										)}
									</div>
									<p className="shrink-0 text-xs text-violet-400/45">{formatDate(row.createdAt)}</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-between gap-3">
					<p className="text-xs text-violet-400/50">
						{total} event{total === 1 ? "" : "s"}
					</p>
					<div className="flex items-center gap-2">
						<Tooltip content="Previous page">
							<span className="inline-flex">
								<button
									type="button"
									disabled={page <= 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									aria-label="Previous page"
									className="cursor-pointer rounded-lg border border-violet-500/20 p-2 text-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
								>
									<ChevronLeft className="size-4" />
								</button>
							</span>
						</Tooltip>
						<span className="text-xs text-violet-300/60">
							{page} / {totalPages}
						</span>
						<Tooltip content="Next page">
							<span className="inline-flex">
								<button
									type="button"
									disabled={page >= totalPages}
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									aria-label="Next page"
									className="cursor-pointer rounded-lg border border-violet-500/20 p-2 text-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
								>
									<ChevronRight className="size-4" />
								</button>
							</span>
						</Tooltip>
					</div>
				</div>
			)}
		</div>
	);
}

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
	const [tab, setTab] = useState<AdminTab>(() =>
		typeof window !== "undefined" ? readAdminLocation().tab : "general",
	);

	useEffect(() => {
		function onPopState() {
			const loc = parseAdminPath(window.location.pathname);
			setTab(loc.tab);
		}
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	function switchTab(next: AdminTab) {
		setTab(next);
		window.history.pushState({}, "", adminPath(next));
	}

	const blurb =
		tab === "general"
			? "Banner and high-level account health"
			: tab === "waitlist"
				? "Interest signups from the marketing site"
				: tab === "workspaces"
					? "Customer tenants, plans, billing status, and users"
					: tab === "audit"
						? "Internal record of admin actions and log-in-as sessions"
						: tab === "status"
							? "Public status page, uptime, and incident messages"
							: "Tickets submitted from the product";

	return (
		<div className="min-h-screen bg-void text-violet-50">
			<header className="border-b border-violet-500/10 bg-ink/60">
				<div className="mx-auto max-w-6xl px-6 py-5">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="flex items-center gap-2.5">
							<img src={logo} alt="Lumantic" className="h-7 w-7" />
							<div>
								<h1 className="font-display text-base font-semibold text-violet-50">Admin</h1>
								<p className="text-xs text-violet-400/50">{blurb}</p>
							</div>
						</div>
						<button
							onClick={onLogout}
							className="flex cursor-pointer items-center gap-2 rounded-full border border-violet-500/20 px-4 py-2 text-sm text-violet-300/70 transition hover:border-violet-400/40 hover:text-violet-50"
						>
							<LogOutIcon className="size-4" />
							Log out
						</button>
					</div>
					<AdminEmployeeDisclaimer className="mt-4" />
					<div className="mt-4 flex flex-wrap items-center gap-3">
						<nav className="flex flex-wrap rounded-xl border border-violet-500/15 bg-white/[0.02] p-1">
							{TAB_IDS.map((id) => (
								<a
									key={id}
									href={adminPath(id)}
									onClick={(e) => {
										e.preventDefault();
										switchTab(id);
									}}
									className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
										tab === id ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
									}`}
								>
									{TAB_LABELS[id]}
								</a>
							))}
						</nav>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-6 py-10">
				{tab === "general" && <GeneralTab password={password} onUnauthorized={onLogout} />}
				{tab === "waitlist" && <WaitlistTab password={password} onUnauthorized={onLogout} />}
				{tab === "workspaces" && <WorkspacesTab password={password} onUnauthorized={onLogout} />}
				{tab === "support" && <SupportTab password={password} onUnauthorized={onLogout} />}
				{tab === "status" && <StatusTab password={password} onUnauthorized={onLogout} />}
				{tab === "audit" && <AuditTab password={password} onUnauthorized={onLogout} />}
			</main>
		</div>
	);
}

export function AdminPage() {
	const [password, setPassword] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY));

	const handleLogout = useCallback(() => {
		sessionStorage.removeItem(STORAGE_KEY);
		setPassword(null);
	}, []);

	const handleSuccess = (pw: string) => {
		sessionStorage.setItem(STORAGE_KEY, pw);
		setPassword(pw);
	};

	return (
		<TooltipProvider>
			{!password ? <LoginScreen onSuccess={handleSuccess} /> : <Dashboard password={password} onLogout={handleLogout} />}
		</TooltipProvider>
	);
}
