import { useCallback, useEffect, useState } from "react";
import logo from "../assets/lumantic-logo.png";
import { AlertIcon, CheckIcon, SpinnerIcon } from "../components/Icons";

type ComponentStatus = "operational" | "degraded" | "outage";

type StatusComponent = {
	id: string;
	name: string;
	status: ComponentStatus;
	latencyMs: number | null;
	detail: string | null;
};

type StatusReport = {
	overall: ComponentStatus;
	checkedAt: string;
	onlineSince: string | null;
	uptime: {
		windowDays: number;
		percent: number | null;
		sampleCount: number;
		okCount: number;
	};
	components: StatusComponent[];
	notice: string | null;
};

const STATUS_COPY: Record<ComponentStatus, { label: string; tone: string; dot: string }> = {
	operational: {
		label: "All systems operational",
		tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
		dot: "bg-emerald-400",
	},
	degraded: {
		label: "Partial disruption",
		tone: "border-amber-400/30 bg-amber-500/10 text-amber-50",
		dot: "bg-amber-300",
	},
	outage: {
		label: "Service disruption",
		tone: "border-rose-500/30 bg-rose-500/10 text-rose-100",
		dot: "bg-rose-400",
	},
};

const COMPONENT_COPY: Record<ComponentStatus, { label: string; className: string }> = {
	operational: { label: "Operational", className: "text-emerald-300" },
	degraded: { label: "Degraded", className: "text-amber-300" },
	outage: { label: "Outage", className: "text-rose-300" },
};

function formatCheckedAt(iso: string) {
	try {
		const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
		return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
	} catch {
		return iso;
	}
}

function formatOnlineDays(iso: string | null): { value: string; detail: string } {
	if (!iso) return { value: "-", detail: "Online since unavailable" };
	try {
		const start = new Date(iso.endsWith("Z") ? iso : `${iso}Z`).getTime();
		if (!Number.isFinite(start)) return { value: "-", detail: "Online since unavailable" };
		const days = Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
		if (days === 0) return { value: "<1d", detail: "Online since today" };
		return {
			value: `${days}d`,
			detail: days === 1 ? "Online for 1 day" : `Online for ${days} days`,
		};
	} catch {
		return { value: "-", detail: "Online since unavailable" };
	}
}

export function StatusPage() {
	const [report, setReport] = useState<StatusReport | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/status");
			const data = (await res.json()) as StatusReport;
			setReport(data);
		} catch {
			setError("Couldn't reach the status API.");
			setReport(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
		const id = window.setInterval(() => void load(), 60_000);
		return () => window.clearInterval(id);
	}, [load]);

	const overall = report?.overall ?? (error ? "outage" : "operational");
	const overallCopy = STATUS_COPY[overall];
	const online = formatOnlineDays(report?.onlineSince ?? null);

	return (
		<div className="relative flex min-h-screen flex-col overflow-hidden bg-void text-violet-50">
			<div
				className="pointer-events-none absolute top-[-10%] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]"
				aria-hidden
			/>

			<header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
				<a href="/" className="flex cursor-pointer items-center gap-2.5">
					<img src={logo} alt="Lumantic" className="h-7 w-7 drop-shadow-[0_0_12px_rgba(184,148,255,0.6)]" />
					<span className="font-display text-lg font-semibold tracking-tight text-violet-50">Lumantic</span>
				</a>
				<a
					href="/app"
					className="cursor-pointer rounded-lg border border-violet-500/25 px-3 py-1.5 text-sm font-medium text-violet-200 transition hover:border-violet-400/50 hover:text-violet-50"
				>
					Open app
				</a>
			</header>

			<main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
				<p className="text-[11px] font-semibold tracking-[0.18em] text-violet-400/50 uppercase">System status</p>
				<h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-violet-50 sm:text-4xl">
					Lumantic status
				</h1>
				<p className="mt-2 text-sm text-violet-300/60">Live health of the API, database, and app.</p>

				<div className={`mt-8 rounded-2xl border px-4 py-4 sm:px-5 ${overallCopy.tone}`}>
					<div className="flex flex-wrap items-center gap-3">
						<span className={`size-2.5 shrink-0 rounded-full ${overallCopy.dot}`} />
						<p className="font-display text-lg font-semibold">
							{error ? "Unable to load status" : overallCopy.label}
						</p>
						{loading ? <SpinnerIcon className="size-4 opacity-70" /> : null}
					</div>
					{report?.checkedAt ? (
						<p className="mt-1.5 text-xs opacity-70">Checked {formatCheckedAt(report.checkedAt)}</p>
					) : null}
				</div>

				{report?.notice ? (
					<div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
						<AlertIcon className="mt-0.5 size-4 shrink-0 text-amber-200/90" />
						<p className="min-w-0 whitespace-pre-wrap">{report.notice}</p>
					</div>
				) : null}

				{error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

				<section className="mt-8 grid gap-3 sm:grid-cols-3">
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-4 py-4">
						<p className="text-[11px] font-semibold tracking-wide text-violet-400/50 uppercase">Uptime (30d)</p>
						<p className="mt-2 font-display text-2xl font-semibold text-violet-50">
							{report?.uptime.percent != null ? `${report.uptime.percent.toFixed(2)}%` : "-"}
						</p>
						<p className="mt-1 text-xs text-violet-400/45">
							{report
								? report.uptime.sampleCount > 0
									? `${report.uptime.okCount} of ${report.uptime.sampleCount} checks passed`
									: "Collecting samples"
								: "-"}
						</p>
					</div>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-4 py-4">
						<p className="text-[11px] font-semibold tracking-wide text-violet-400/50 uppercase">Continuous</p>
						<p className="mt-2 font-display text-2xl font-semibold text-violet-50">{online.value}</p>
						<p className="mt-1 text-xs text-violet-400/45">{online.detail}</p>
					</div>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-4 py-4">
						<p className="text-[11px] font-semibold tracking-wide text-violet-400/50 uppercase">Monitoring</p>
						<p className="mt-2 font-display text-2xl font-semibold text-violet-50">5 min</p>
						<p className="mt-1 text-xs text-violet-400/45">Automated health checks</p>
					</div>
				</section>

				<section className="mt-8 overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02]">
					<div className="border-b border-violet-500/10 px-4 py-3 sm:px-5">
						<h2 className="text-sm font-semibold text-violet-100">Components</h2>
					</div>
					<ul className="divide-y divide-violet-500/10">
						{(report?.components ?? []).map((component) => {
							const copy = COMPONENT_COPY[component.status];
							return (
								<li
									key={component.id}
									className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium text-violet-50">{component.name}</p>
										{component.detail ? (
											<p className="mt-0.5 text-xs text-violet-400/55">{component.detail}</p>
										) : null}
									</div>
									<div className="flex items-center gap-3 text-xs">
										{component.latencyMs != null ? (
											<span className="tabular-nums text-violet-400/50">{component.latencyMs} ms</span>
										) : null}
										<span className={`inline-flex items-center gap-1.5 font-medium ${copy.className}`}>
											{component.status === "operational" ? <CheckIcon className="size-3.5" /> : null}
											{copy.label}
										</span>
									</div>
								</li>
							);
						})}
						{!report && !loading ? (
							<li className="px-4 py-8 text-center text-sm text-violet-400/50 sm:px-5">No component data</li>
						) : null}
						{loading && !report ? (
							<li className="flex justify-center px-4 py-10 sm:px-5">
								<SpinnerIcon className="size-5 text-violet-400/50" />
							</li>
						) : null}
					</ul>
				</section>

				<div className="mt-6 flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={() => void load()}
						disabled={loading}
						className="cursor-pointer rounded-lg border border-violet-500/25 px-3.5 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/50 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
					>
						Refresh
					</button>
					<a href="/" className="text-sm text-violet-300/70 transition hover:text-violet-100">
						Back to homepage
					</a>
				</div>
			</main>
		</div>
	);
}
