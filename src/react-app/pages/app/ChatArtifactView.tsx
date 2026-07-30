import type { ChatArtifact, CrashesTableArtifact, SessionsTableArtifact, SignupsChartArtifact } from "../../../shared/beacon-analytics";

function formatMinutes(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h <= 0) return `${m}m`;
	return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function SignupsChart({ artifact }: { artifact: SignupsChartArtifact }) {
	const max = Math.max(...artifact.points.map((p) => p.value), 1);
	const w = 560;
	const h = 200;
	const padX = 28;
	const padY = 24;
	const chartW = w - padX * 2;
	const chartH = h - padY * 2;

	const coords = artifact.points.map((p, i) => {
		const x = padX + (i / Math.max(artifact.points.length - 1, 1)) * chartW;
		const y = padY + chartH - (p.value / max) * chartH;
		return { ...p, x, y };
	});
	const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
	const area = `${line} L ${coords[coords.length - 1]?.x ?? padX} ${(padY + chartH).toFixed(1)} L ${padX} ${(padY + chartH).toFixed(1)} Z`;

	return (
		<div className="w-full min-w-0 overflow-hidden rounded-xl border border-violet-500/15 bg-white/[0.02] p-3">
			<p className="mb-2 text-xs font-medium text-violet-200/80">{artifact.title}</p>
			<svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label={artifact.title}>
						<path d={area} fill="url(#beaconSignupsFill)" opacity={0.4} />
				<path d={line} fill="none" stroke="#b894ff" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
				{coords.map((c) => (
					<g key={c.label}>
						<circle cx={c.x} cy={c.y} r={3.5} fill="#e8deff" />
						{["Mar 3", "Mar 18"].includes(c.label) && (
							<>
								<line x1={c.x} y1={padY} x2={c.x} y2={padY + chartH} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 4" opacity={0.85} />
								<text x={c.x} y={padY - 6} textAnchor="middle" className="fill-amber-200" fontSize={10}>
									{c.label}
								</text>
							</>
						)}
					</g>
				))}
				{coords
					.filter((_, i) => i % 2 === 0 || i === coords.length - 1)
					.map((c) => (
						<text key={`lbl-${c.label}`} x={c.x} y={h - 4} textAnchor="middle" className="fill-violet-300" fontSize={10}>
							{c.label}
						</text>
					))}
				<defs>
					<linearGradient id="beaconSignupsFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#8f63f8" stopOpacity={0.6} />
						<stop offset="100%" stopColor="#8f63f8" stopOpacity={0} />
					</linearGradient>
				</defs>
			</svg>
			<p className="mt-1 text-[11px] text-violet-400/45">Daily Beacon {artifact.unit}</p>
		</div>
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
											<span className="text-[11px] font-semibold text-white drop-shadow">{formatMinutes(row.minutes)}</span>
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

export function ChatArtifactView({ artifact }: { artifact: ChatArtifact }) {
	if (artifact.type === "signups_chart") return <SignupsChart artifact={artifact} />;
	if (artifact.type === "sessions_table") return <SessionsTable artifact={artifact} />;
	return <CrashesTable artifact={artifact} />;
}
