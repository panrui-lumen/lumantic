import type { ReactNode } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type {
	AreaChartArtifact,
	ChatArtifact,
	CodeFixArtifact,
	CrashesTableArtifact,
	PieChartArtifact,
	SessionsTableArtifact,
	SignupsChartArtifact,
	StackedBarChartArtifact,
} from "../../../shared/beacon-analytics";
import { ExternalLinkIcon, GitHubIcon } from "../../components/Icons";

/** Lumantic brand palette for Recharts (matches index.css violet scale + accents). */
export const CHART_COLORS = [
	"#8f63f8", // violet-500
	"#b894ff", // violet-400
	"#5c34c4", // violet-700
	"#d4c2ff", // violet-300
	"#fbbf24", // amber
	"#86efac", // green
	"#9ad4ff", // sky
	"#fda4af", // rose
] as const;

const TOOLTIP_STYLE = {
	backgroundColor: "#0a0814",
	border: "1px solid rgba(143, 99, 248, 0.28)",
	borderRadius: 10,
	color: "#f3efff",
	fontSize: 12,
	boxShadow: "0 12px 40px -12px rgba(143, 99, 248, 0.45)",
} as const;

const AXIS_TICK = { fill: "#b894ff", fontSize: 11, opacity: 0.75 } as const;
const GRID_STROKE = "rgba(184, 148, 255, 0.12)";

function ChartShell({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
	return (
		<div className="w-full min-w-0 overflow-hidden rounded-xl border border-violet-500/15 bg-white/[0.02] p-3">
			<p className="mb-2 text-xs font-medium text-violet-200/80">{title}</p>
			<div className="h-56 w-full min-w-0 sm:h-64">{children}</div>
			{footer ? <p className="mt-1 text-[11px] text-violet-400/45">{footer}</p> : null}
		</div>
	);
}

function formatMinutes(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h <= 0) return `${m}m`;
	return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function formatCompact(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
	return String(n);
}

function SignupsChart({ artifact }: { artifact: SignupsChartArtifact }) {
	const data = artifact.points.map((p) => ({ ...p }));
	const markers = new Set(["Mar 3", "Mar 18"]);
	return (
		<ChartShell title={artifact.title} footer={`Daily Beacon ${artifact.unit}`}>
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
					<defs>
						<linearGradient id="lumanticSignupsFill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#8f63f8" stopOpacity={0.55} />
							<stop offset="100%" stopColor="#8f63f8" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid stroke={GRID_STROKE} vertical={false} />
					<XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
					<YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} tickFormatter={formatCompact} />
					<Tooltip
						contentStyle={TOOLTIP_STYLE}
						labelStyle={{ color: "#d4c2ff" }}
						formatter={(value) => [value as number, artifact.unit]}
					/>
					<Area
						type="monotone"
						dataKey="value"
						stroke="#b894ff"
						strokeWidth={2.5}
						fill="url(#lumanticSignupsFill)"
						dot={(props) => {
							const { cx, cy, payload } = props;
							if (cx == null || cy == null) return null;
							const isMarker = markers.has(String(payload.label));
							return (
								<circle
									cx={cx}
									cy={cy}
									r={isMarker ? 5 : 3}
									fill={isMarker ? "#fbbf24" : "#e8deff"}
									stroke={isMarker ? "#fbbf24" : "#8f63f8"}
									strokeWidth={isMarker ? 1.5 : 0}
								/>
							);
						}}
						activeDot={{ r: 5, fill: "#e8deff", stroke: "#8f63f8", strokeWidth: 2 }}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</ChartShell>
	);
}

function AreaSeriesChart({ artifact }: { artifact: AreaChartArtifact }) {
	const data = artifact.points.map((p) => ({ ...p }));
	return (
		<ChartShell title={artifact.title} footer={`Weekly Beacon ${artifact.unit}`}>
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
					<defs>
						<linearGradient id="lumanticAreaFill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#8f63f8" stopOpacity={0.5} />
							<stop offset="100%" stopColor="#5c34c4" stopOpacity={0.05} />
						</linearGradient>
					</defs>
					<CartesianGrid stroke={GRID_STROKE} vertical={false} />
					<XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
					<YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} tickFormatter={formatCompact} />
					<Tooltip
						contentStyle={TOOLTIP_STYLE}
						labelStyle={{ color: "#d4c2ff" }}
						formatter={(value) => [Number(value).toLocaleString(), artifact.unit]}
					/>
					<Area
						type="monotone"
						dataKey="value"
						stroke="#b894ff"
						strokeWidth={2.5}
						fill="url(#lumanticAreaFill)"
						dot={{ r: 3, fill: "#e8deff", strokeWidth: 0 }}
						activeDot={{ r: 5, fill: "#e8deff", stroke: "#8f63f8", strokeWidth: 2 }}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</ChartShell>
	);
}

function PieSeriesChart({ artifact }: { artifact: PieChartArtifact }) {
	const data = artifact.slices.map((s, i) => ({
		...s,
		color: CHART_COLORS[i % CHART_COLORS.length],
	}));
	const total = data.reduce((sum, s) => sum + s.value, 0) || 1;
	return (
		<ChartShell title={artifact.title} footer={artifact.unit ? `Share of ${artifact.unit}` : undefined}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={data}
						dataKey="value"
						nameKey="label"
						cx="42%"
						cy="50%"
						innerRadius="48%"
						outerRadius="72%"
						paddingAngle={2}
						stroke="#050409"
						strokeWidth={2}
					>
						{data.map((entry) => (
							<Cell key={entry.label} fill={entry.color} />
						))}
					</Pie>
					<Tooltip
						contentStyle={TOOLTIP_STYLE}
						formatter={(value, name) => [
							`${Number(value).toLocaleString()} (${Math.round((Number(value) / total) * 100)}%)`,
							String(name),
						]}
					/>
					<Legend
						layout="vertical"
						align="right"
						verticalAlign="middle"
						iconType="circle"
						wrapperStyle={{ fontSize: 11, color: "#d4c2ff", paddingLeft: 8 }}
					/>
				</PieChart>
			</ResponsiveContainer>
		</ChartShell>
	);
}

function StackedBarSeriesChart({ artifact }: { artifact: StackedBarChartArtifact }) {
	const data = artifact.rows.map((row) => ({ label: row.label, ...row.values }));
	return (
		<ChartShell title={artifact.title} footer={`Stacked ${artifact.unit} by plan`}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
					<CartesianGrid stroke={GRID_STROKE} vertical={false} />
					<XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
					<YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} tickFormatter={formatCompact} />
					<Tooltip
						contentStyle={TOOLTIP_STYLE}
						labelStyle={{ color: "#d4c2ff" }}
						formatter={(value, name) => {
							const series = artifact.series.find((s) => s.key === name);
							return [Number(value).toLocaleString(), series?.label ?? String(name)];
						}}
					/>
					<Legend
						iconType="circle"
						wrapperStyle={{ fontSize: 11, color: "#d4c2ff", paddingTop: 4 }}
						formatter={(value) => artifact.series.find((s) => s.key === value)?.label ?? value}
					/>
					{artifact.series.map((s, i) => (
						<Bar
							key={s.key}
							dataKey={s.key}
							name={s.key}
							stackId="plans"
							fill={CHART_COLORS[i % CHART_COLORS.length]}
							radius={i === artifact.series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
							maxBarSize={42}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>
		</ChartShell>
	);
}

function SessionsTable({ artifact }: { artifact: SessionsTableArtifact }) {
	const max = Math.max(...artifact.rows.map((r) => r.minutes), 1);
	return (
		<div className="w-full min-w-0 overflow-hidden rounded-xl border border-violet-500/15 bg-white/[0.02]">
			<p className="border-b border-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200/80">{artifact.title}</p>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[28rem] text-left text-sm">
					<thead>
						<tr className="text-[11px] tracking-wide text-violet-400/50 uppercase">
							<th className="px-3 py-2 font-medium">User</th>
							<th className="px-3 py-2 font-medium">Email</th>
							<th className="px-3 py-2 font-medium">Session</th>
						</tr>
					</thead>
					<tbody>
						{artifact.rows.map((row) => (
							<tr key={row.email} className="border-t border-violet-500/5">
								<td className="px-3 py-2.5 font-medium whitespace-nowrap text-violet-100">{row.name}</td>
								<td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-violet-300/60">{row.email}</td>
								<td className="px-3 py-2.5">
									<div className="relative h-7 w-full min-w-[9rem] overflow-hidden rounded-md bg-white/[0.04]">
										<div
											className="flex h-full items-center rounded-md bg-gradient-to-r from-violet-600 to-violet-500 px-2"
											style={{ width: `${Math.max(18, (row.minutes / max) * 100)}%` }}
										>
											<span className="text-[11px] font-semibold text-white drop-shadow">
												{formatMinutes(row.minutes)}
											</span>
										</div>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function CrashesTable({ artifact }: { artifact: CrashesTableArtifact }) {
	return (
		<div className="w-full min-w-0 overflow-hidden rounded-xl border border-violet-500/15 bg-white/[0.02]">
			<p className="border-b border-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200/80">{artifact.title}</p>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[28rem] text-left text-sm">
					<thead>
						<tr className="text-[11px] tracking-wide text-violet-400/50 uppercase">
							<th className="px-3 py-2 font-medium">User</th>
							<th className="px-3 py-2 font-medium">Email</th>
							<th className="px-3 py-2 font-medium">Page</th>
							<th className="px-3 py-2 font-medium">When</th>
						</tr>
					</thead>
					<tbody>
						{artifact.rows.map((row) => (
							<tr key={`${row.email}-${row.page}-${row.when}`} className="border-t border-violet-500/5">
								<td className="px-3 py-2.5 font-medium whitespace-nowrap text-violet-100">{row.name}</td>
								<td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-violet-300/60">{row.email}</td>
								<td className="px-3 py-2.5 font-mono text-xs text-amber-200/90">{row.page}</td>
								<td className="px-3 py-2.5 text-xs whitespace-nowrap text-violet-400/55">{row.when}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function CodeFixCard({ artifact }: { artifact: CodeFixArtifact }) {
	return (
		<div className="w-full min-w-0 overflow-hidden rounded-xl border border-violet-500/15 bg-white/[0.02]">
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-violet-500/10 px-3 py-2.5">
				<div className="min-w-0">
					<p className="text-xs font-medium text-violet-200/80">{artifact.title}</p>
					<p className="mt-0.5 truncate font-mono text-[11px] text-violet-400/55">
						{artifact.repo} · {artifact.path}
					</p>
				</div>
				<a
					href={artifact.prUrl}
					target="_blank"
					rel="noreferrer"
					className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/25 bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
				>
					<GitHubIcon className="size-3.5" />
					Open PR
					<ExternalLinkIcon className="size-3 opacity-80" />
				</a>
			</div>
			<pre className="max-h-72 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-violet-100/85">
				<code>{artifact.snippet}</code>
			</pre>
			<p className="border-t border-violet-500/10 px-3 py-2 text-[11px] text-violet-400/50">
				PR title: {artifact.prTitle}
			</p>
		</div>
	);
}

export function ChatArtifactView({ artifact }: { artifact: ChatArtifact }) {
	if (artifact.type === "signups_chart") return <SignupsChart artifact={artifact} />;
	if (artifact.type === "area_chart") return <AreaSeriesChart artifact={artifact} />;
	if (artifact.type === "pie_chart") return <PieSeriesChart artifact={artifact} />;
	if (artifact.type === "stacked_bar_chart") return <StackedBarSeriesChart artifact={artifact} />;
	if (artifact.type === "sessions_table") return <SessionsTable artifact={artifact} />;
	if (artifact.type === "code_fix") return <CodeFixCard artifact={artifact} />;
	return <CrashesTable artifact={artifact} />;
}
