import { ConversionChart } from "../ConversionChart";
import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const RAW_SOURCES = [
	{
		label: "Users API",
		tag: "REST · cursor-paginated",
		rows: [
			{ k: "id", v: '"usr_7f31"', indent: 0 },
			{ k: "created_at", v: '"2026-07-15T09:21:44Z"', indent: 0 },
			{ k: "country", v: '"GB"', indent: 0 },
			{ k: "acquisition", v: "{", indent: 0 },
			{ k: "channel", v: '"paid_social"', indent: 1 },
			{ k: "campaign", v: '"summer_dep"', indent: 1 },
			{ k: "}", v: "", indent: 0, bare: true },
			{ k: "device", v: "{", indent: 0 },
			{ k: "platform", v: '"mobile_web"', indent: 1 },
			{ k: "os", v: '"iOS"', indent: 1 },
			{ k: "}", v: "", indent: 0, bare: true },
		],
	},
	{
		label: "Payment webhook",
		tag: "at-least-once · nested JSON",
		rows: [
			{ k: "id", v: '"evt_pay_01988"', indent: 0 },
			{ k: "type", v: '"deposit.attempt.updated"', indent: 0 },
			{ k: "attempt.id", v: '"dep_a91"', indent: 0 },
			{ k: "attempt.user_id", v: '"usr_7f31"', indent: 0 },
			{ k: "attempt.provider", v: '"PayFlow"', indent: 0 },
			{ k: "attempt.amount", v: '"75.00 GBP"', indent: 0 },
			{ k: "attempt.status", v: '"failed"', indent: 0 },
			{ k: "failure.code", v: '"3DS_TIMEOUT"', indent: 0 },
			{ k: "client.platform", v: '"mobile_web"', indent: 0 },
			{ k: "client.app_version", v: '"web-2.14"', indent: 0 },
		],
	},
	{
		label: "Release log",
		tag: "deploy events · CI",
		rows: [
			{ k: "version", v: '"web-2.14"', indent: 0 },
			{ k: "deployed_at", v: '"2026-07-15T00:17:02Z"', indent: 0 },
			{ k: "environment", v: '"production"', indent: 0 },
			{ k: "change", v: '"hosted 3DS handoff"', indent: 0 },
			{ k: "timeout_ms", v: "30000", indent: 0 },
			{ k: "rollout", v: '"100%"', indent: 0 },
			{ k: "previous", v: '"web-2.13"', indent: 0 },
			{ k: "owner", v: '"payments-web"', indent: 0 },
		],
	},
];

const JOIN_NODES = [
	{ id: "users", label: "users", key: "id", color: "sky" },
	{ id: "attempts", label: "deposit_attempts", key: "user_id · app_version", color: "violet" },
	{ id: "releases", label: "releases", key: "version", color: "emerald" },
	{ id: "metric", label: "deposit_conversion", key: "week · platform", color: "amber" },
];

const ATTEMPTS_ROWS = [
	["dep_a91", "usr_7f31", "failed", "3DS_TIMEOUT", "mobile_web", "web-2.14", "75.00"],
	["dep_a92", "usr_7f44", "failed", "3DS_TIMEOUT", "mobile_web", "web-2.14", "50.00"],
	["dep_a70", "usr_7e02", "succeeded", "—", "desktop", "web-2.13", "100.00"],
];

const ATTEMPTS_COLS = ["attempt_id", "user_id", "status", "failure", "platform", "app_ver", "amount"];

const METRIC_ROWS = [
	["8–14 Jul", "mobile_web", "68%", "1,204"],
	["15–21 Jul", "mobile_web", "51%", "1,187"],
	["15–21 Jul", "desktop", "71%", "842"],
];

const METRIC_COLS = ["week", "platform", "conversion", "attempts"];

const COMING_SOON = [
	"Automated experimentation",
	"Dashboarding",
	"Alerting",
	"Monitoring",
	"Proactive product analysis",
];

function StepLabel({ step, title }: { step: string; title: string }) {
	return (
		<div className="mb-4 flex items-center gap-3">
			<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 font-mono text-xs text-violet-300 ring-1 ring-violet-400/25">
				{step}
			</span>
			<h3 className="font-display text-sm font-semibold text-violet-50 sm:text-base">{title}</h3>
		</div>
	);
}

function MiniTable({
	name,
	badge,
	cols,
	rows,
	highlightCols = [],
}: {
	name: string;
	badge?: string;
	cols: string[];
	rows: string[][];
	highlightCols?: number[];
}) {
	return (
		<div className="overflow-hidden rounded-xl border border-violet-400/20 bg-[#08060f]/90">
			<div className="flex items-center justify-between gap-2 border-b border-violet-500/10 px-3 py-2">
				<span className="font-mono text-[11px] font-medium text-violet-100">{name}</span>
				{badge && (
					<span className="rounded bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] text-amber-200/90">{badge}</span>
				)}
			</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[18rem] border-collapse text-left font-mono text-[10px]">
					<thead>
						<tr className="border-b border-violet-500/10 bg-white/[0.02]">
							{cols.map((col, i) => (
								<th
									key={col}
									className={`px-2 py-1.5 font-medium whitespace-nowrap ${
										highlightCols.includes(i) ? "text-sky-300/90" : "text-violet-300/55"
									}`}
								>
									{col}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, ri) => (
							<tr key={ri} className="border-b border-violet-500/5 last:border-0">
								{row.map((cell, ci) => (
									<td
										key={ci}
										className={`px-2 py-1.5 whitespace-nowrap ${
											highlightCols.includes(ci)
												? "text-sky-200/85"
												: cell === "failed" || cell === "3DS_TIMEOUT" || cell === "51%"
													? "text-rose-300/85"
													: cell === "succeeded" || cell === "68%" || cell === "71%"
														? "text-emerald-300/85"
														: "text-violet-200/70"
										}`}
									>
										{cell}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}


export function WorkedExample() {
	return (
		<section id="how-it-works" className="relative border-t border-violet-500/10 py-28">
			<div className="mx-auto max-w-7xl px-6">
				<SectionHeading
					title="From raw sources to a trusted answer."
					subtitle="We ingest messy payloads from every system, model them into a semantic layer your team can trust, then our Data Agent queries it to answer questions in plain language."
					align="center"
				/>

				<Reveal delay={80} className="mx-auto mt-12 max-w-2xl">
					<div className="rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] px-5 py-4 text-center">
						<span className="font-mono text-[10px] tracking-[0.2em] text-violet-300/70 uppercase">Example question</span>
						<p className="font-display mt-2 text-lg text-violet-50 sm:text-xl">
							"Why did deposit conversion fall last week?"
						</p>
					</div>
				</Reveal>

				{/* Step 1 — Raw sources (full width for more content) */}
				<Reveal className="mt-14">
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6 sm:p-7">
						<StepLabel step="01" title="Raw sources land as-is" />
						<p className="mb-5 max-w-2xl text-xs text-violet-300/55">
							Different formats, nested fields, duplicate events, string timestamps — we ingest and normalise each
							one before anything is joined.
						</p>
						<div className="grid gap-4 md:grid-cols-3">
							{RAW_SOURCES.map((src) => (
								<div key={src.label} className="overflow-hidden rounded-xl border border-violet-500/10 bg-[#08060f]">
									<div className="flex items-center justify-between gap-2 border-b border-violet-500/10 px-3.5 py-2.5">
										<span className="font-mono text-[10px] text-violet-200/85">{src.label}</span>
										<span className="shrink-0 font-mono text-[9px] text-violet-400/50">{src.tag}</span>
									</div>
									<div className="space-y-0.5 px-3.5 py-3 font-mono text-[11px] leading-relaxed">
										{src.rows.map((row, i) =>
											"bare" in row && row.bare ? (
												<div key={`${src.label}-${i}`} style={{ paddingLeft: `${row.indent * 0.75}rem` }}>
													<span className="text-violet-400/50">{row.k}</span>
												</div>
											) : (
												<div
													key={`${src.label}-${row.k}-${i}`}
													className="flex gap-1.5"
													style={{ paddingLeft: `${row.indent * 0.75}rem` }}
												>
													<span className="text-sky-300/80">{row.k}</span>
													{row.v !== "{" && <span className="text-violet-400/40">:</span>}
													<span className={row.v === "{" ? "text-violet-400/50" : "text-emerald-300/85"}>
														{row.v}
													</span>
												</div>
											),
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</Reveal>

				<div className="flex justify-center py-3" aria-hidden>
					<div className="flex flex-col items-center gap-1">
						<div className="h-6 w-px bg-gradient-to-b from-violet-500/30 to-violet-400/50" />
						<span className="text-[10px] text-violet-400/60">▶</span>
					</div>
				</div>

				{/* Step 2 — Semantic layer visual */}
				<Reveal delay={100}>
					<div className="relative overflow-hidden rounded-2xl border border-violet-400/30 bg-violet-500/[0.06] p-6 shadow-[0_0_50px_-18px_rgba(132,87,246,0.55)] sm:p-7">
						<StepLabel step="02" title="Semantic layer in your warehouse" />
						<p className="mb-6 max-w-2xl text-xs text-violet-300/55">
							Payloads are joined on shared keys, deduplicated, and defined as tables and metrics — human-readable
							for your team, structured for the Data Agent.
						</p>

						{/* Join graph */}
						<div className="mb-6 rounded-xl border border-violet-400/20 bg-[#08060f]/70 p-4 sm:p-5">
							<p className="mb-4 font-mono text-[10px] tracking-[0.16em] text-violet-400/60 uppercase">
								Join map · how sources connect
							</p>
							<div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-2">
								{JOIN_NODES.map((node, i) => (
									<div key={node.id} className="contents lg:contents">
										<div
											className={`rounded-xl border px-3.5 py-3 text-center ${
												node.color === "amber"
													? "border-amber-400/30 bg-amber-400/10"
													: node.color === "sky"
														? "border-sky-400/25 bg-sky-400/10"
														: node.color === "emerald"
															? "border-emerald-400/25 bg-emerald-400/10"
															: "border-violet-400/30 bg-violet-500/15"
											}`}
										>
											<p className="font-mono text-[11px] font-medium text-violet-50">{node.label}</p>
											<p className="mt-1 font-mono text-[9px] text-violet-300/55">key: {node.key}</p>
										</div>
										{i < JOIN_NODES.length - 1 && (
											<div className="flex items-center justify-center lg:px-1" aria-hidden>
												<span className="hidden font-mono text-[10px] text-violet-400/50 lg:inline">──▶</span>
												<span className="font-mono text-[10px] text-violet-400/50 lg:hidden">↓</span>
											</div>
										)}
									</div>
								))}
							</div>
							<div className="mt-4 flex flex-wrap gap-2">
								<span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 font-mono text-[10px] text-sky-200/80">
									users.id = attempts.user_id
								</span>
								<span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] text-emerald-200/80">
									attempts.app_version = releases.version
								</span>
								<span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] text-amber-200/80">
									conversion = succeeded ÷ total
								</span>
							</div>
						</div>

						{/* Live table previews */}
						<div className="grid gap-4 lg:grid-cols-2">
							<MiniTable
								name="deposit_attempts"
								cols={ATTEMPTS_COLS}
								rows={ATTEMPTS_ROWS}
								highlightCols={[1, 5]}
							/>
							<MiniTable
								name="deposit_conversion"
								badge="metric"
								cols={METRIC_COLS}
								rows={METRIC_ROWS}
								highlightCols={[2]}
							/>
						</div>

						<p className="mt-4 font-mono text-[10px] text-violet-400/45">
							usr_7f31 · dep_a91 · web-2.14 · 3DS_TIMEOUT → joined, typed, and queryable
						</p>
					</div>
				</Reveal>

				<div className="flex justify-center py-3" aria-hidden>
					<div className="flex flex-col items-center gap-1">
						<div className="h-6 w-px bg-gradient-to-b from-violet-500/30 to-violet-400/50" />
						<span className="text-[10px] text-violet-400/60">▶</span>
					</div>
				</div>

				{/* Step 3 — Data Agent answer */}
				<Reveal delay={160}>
					<div className="mx-auto max-w-4xl rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6 sm:p-7">
						<StepLabel step="03" title="Data Agent queries &amp; answers" />
						<p className="mb-4 text-xs text-violet-300/55">
							Your team asks in Slack. The agent plans the query against warehouse with coherent semantic layer, investigates, and
							returns a clear answer.
						</p>

						<div className="overflow-hidden rounded-xl border border-violet-500/15 bg-[#08060f]">
							<div className="flex items-center gap-2 border-b border-violet-500/10 bg-white/[0.02] px-4 py-2.5">
								<span className="size-2 rounded-full bg-[#E01E5A]/80" />
								<span className="font-mono text-[10px] text-violet-300/60">#growth · Lumantic Data Agent</span>
							</div>
							<div className="space-y-4 p-4 sm:p-5">
								<div>
									<p className="font-mono text-[10px] text-violet-400/60">Sarah · 9:14 AM</p>
									<p className="mt-1 text-sm text-violet-100">Why did deposit conversion fall last week?</p>
								</div>
								<div className="rounded-lg border border-violet-400/20 bg-violet-500/[0.08] p-3.5 sm:p-4">
									<p className="font-mono text-[10px] text-violet-300/70">Lumantic Data Agent</p>
									<p className="mt-2 text-sm leading-relaxed text-violet-100/90">
										Conversion dropped from <span className="text-emerald-300">68%</span> (8–14 Jul) to{" "}
										<span className="text-rose-300">51%</span> (15–21 Jul) on mobile_web.
									</p>
									<p className="mt-2 text-sm leading-relaxed text-violet-200/75">
										Root cause: <span className="font-mono text-amber-200/90">3DS_TIMEOUT</span> failures spiked 3.2×
										after <span className="font-mono text-sky-200/90">web-2.14</span> deployed at 00:17Z on 15 Jul —
										the new hosted 3DS handoff is timing out on slower mobile networks.
									</p>
									<p className="mt-2 text-sm leading-relaxed text-violet-200/75">
										847 affected attempts · ~£63k attempted volume. Impact is concentrated in GB mobile_web; desktop
										and iOS native are unchanged.
									</p>

									<ConversionChart idPrefix="how" />

									<a
										href="#how-it-works"
										className="mt-3 flex items-start gap-2 rounded-md border border-violet-400/15 bg-white/[0.02] px-3 py-2.5 transition hover:border-violet-400/30 hover:bg-white/[0.04]"
									>
										<span className="mt-0.5 font-mono text-[10px] text-violet-400/70">SQL</span>
										<span className="min-w-0 flex-1">
											<span className="block text-sm text-violet-100">
												Open query for audit
												<span className="ml-1.5 text-violet-400/50">↗</span>
											</span>
											<span className="mt-0.5 block truncate font-mono text-[10px] text-violet-300/45">
												warehouse · deposit_conversion_by_platform · 24 Jun–21 Jul
											</span>
										</span>
									</a>

									<div className="mt-3 space-y-2 border-t border-violet-400/15 pt-3">
										<p className="text-sm font-medium text-violet-100">Proposed fix</p>
										<ul className="space-y-1.5 text-sm leading-relaxed text-violet-200/75">
											<li>
												1. Roll back <span className="font-mono text-sky-200/90">web-2.14</span> hosted 3DS
												handoff, or extend the timeout from 30s → 90s.
											</li>
											<li>2. Add a fallback to the previous 3DS flow if the hosted handoff fails once.</li>
											<li>3. Gate the change behind a 10% canary before full rollout next time.</li>
										</ul>
									</div>

									<div className="mt-3 rounded-md border border-violet-400/15 bg-violet-500/[0.06] px-3 py-2.5 text-sm leading-relaxed text-violet-100/90">
										Want me to keep monitoring{" "}
										<span className="font-mono text-amber-200/90">deposit_conversion</span> on mobile_web and report
										back every 4 hours until it recovers above 65%?
									</div>
								</div>
							</div>
						</div>
					</div>
				</Reveal>

				<Reveal delay={240} className="mt-14">
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6 sm:p-8">
						<span className="font-mono text-[10px] tracking-[0.18em] text-violet-400/70 uppercase">Coming soon</span>
						<h3 className="font-display mt-2 text-xl font-semibold text-violet-50 sm:text-2xl">
							The Data Agent is just getting started
						</h3>
						<p className="mt-2 max-w-2xl text-sm text-violet-300/60 sm:text-base">
							Today it answers questions with senior-level accuracy. Next, it will proactively run your data
							operations — so your team spends less time investigating and more time deciding.
						</p>
						<div className="mt-6 flex flex-wrap justify-start gap-3">
							{COMING_SOON.map((cap) => (
								<span
									key={cap}
									className="rounded-full border border-dashed border-violet-400/30 bg-violet-500/[0.06] px-5 py-2.5 font-mono text-sm text-violet-200/80 sm:px-6 sm:py-3 sm:text-base"
								>
									{cap}
								</span>
							))}
						</div>
					</div>
				</Reveal>

				<Reveal delay={300}>
					<p className="mt-8 text-center text-xs text-violet-400/40">
						All records, vendors, releases, and results are synthetic.
					</p>
				</Reveal>
			</div>
		</section>
	);
}
