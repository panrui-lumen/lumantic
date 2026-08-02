import { ConversionChart } from "../ConversionChart";
import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const TABLES = [
	{
		name: "deposit_attempts",
		cols: ["attempt_id", "user_id", "status", "failure", "platform"],
		rows: [
			["dep_a91", "usr_7f31", "failed", "3DS_TIMEOUT", "mobile_web"],
			["dep_a92", "usr_7f44", "failed", "3DS_TIMEOUT", "mobile_web"],
			["dep_a70", "usr_7e02", "succeeded", "—", "desktop"],
		],
	},
	{
		name: "deposit_conversion",
		badge: "metric",
		cols: ["week", "platform", "conversion"],
		rows: [
			["8–14 Jul", "mobile_web", "68%"],
			["15–21 Jul", "mobile_web", "51%"],
			["15–21 Jul", "desktop", "71%"],
		],
	},
];

export function ProductPreview() {
	return (
		<section id="looks-like" className="relative border-t border-violet-500/10 py-20 sm:py-24">
			<div className="mx-auto max-w-6xl px-6">
				<SectionHeading
					title="What it looks like"
					subtitle="A trusted warehouse. A clear answer in Slack. Same question, no archaeology."
				/>

				{/* Warehouse */}
				<Reveal className="mt-12">
					<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-[#08060f]">
						<div className="border-b border-violet-500/10 px-5 py-3.5">
							<p className="font-mono text-[10px] tracking-[0.16em] text-violet-400/60 uppercase">Your warehouse</p>
							<p className="font-display mt-1 text-base font-semibold text-violet-50">
								Clean tables. Shared definitions.
							</p>
						</div>
						<div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
							{TABLES.map((table) => (
								<div key={table.name} className="overflow-hidden rounded-xl border border-violet-500/10">
									<div className="flex items-center gap-2 border-b border-violet-500/10 bg-white/[0.02] px-3 py-2">
										<span className="font-mono text-[11px] text-violet-100">{table.name}</span>
										{table.badge && (
											<span className="rounded bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] text-amber-200/90">
												{table.badge}
											</span>
										)}
									</div>
									<div className="overflow-x-auto">
										<table className="w-full min-w-[16rem] border-collapse text-left font-mono text-[10px] sm:text-[11px]">
											<thead>
												<tr className="border-b border-violet-500/10">
													{table.cols.map((col) => (
														<th
															key={col}
															className="px-2.5 py-1.5 font-medium whitespace-nowrap text-violet-300/50"
														>
															{col}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{table.rows.map((row, ri) => (
													<tr key={ri} className="border-b border-violet-500/5 last:border-0">
														{row.map((cell, ci) => (
															<td
																key={ci}
																className={`px-2.5 py-1.5 whitespace-nowrap ${
																	cell === "failed" || cell === "3DS_TIMEOUT" || cell === "51%"
																		? "text-rose-300/85"
																		: cell === "succeeded" || cell === "68%" || cell === "71%"
																			? "text-emerald-300/85"
																			: "text-violet-200/75"
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
							))}
						</div>
						<p className="px-5 pb-4 font-mono text-[10px] text-violet-400/45">
							Joined · deduplicated · queryable by your team and by Lumantic
						</p>
					</div>
				</Reveal>

				{/* Full Slack answer */}
				<Reveal delay={100} className="mt-6">
					<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-[#08060f]">
						<div className="flex items-center gap-2 border-b border-violet-500/10 px-5 py-3.5">
							<span className="size-2 rounded-full bg-[#E01E5A]/80" />
							<p className="font-mono text-[10px] text-violet-300/60">#growth · Lumantic Data Agent</p>
						</div>
						<div className="space-y-4 p-5 sm:p-6">
							<div>
								<p className="font-mono text-[10px] text-violet-400/55">Sarah · 9:14 AM</p>
								<p className="mt-1 text-sm text-violet-100 sm:text-base">
									Why did deposit conversion fall last week?
								</p>
							</div>
							<div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.07] p-4 sm:p-5">
								<p className="font-mono text-[10px] text-violet-300/70">Lumantic Data Agent</p>
								<p className="mt-3 text-sm leading-relaxed text-violet-100/90">
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

								<ConversionChart idPrefix="home" />

								<a
									href="/how-it-works"
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
											1. Roll back <span className="font-mono text-sky-200/90">web-2.14</span> hosted 3DS handoff,
											or extend the timeout from 30s → 90s.
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
				</Reveal>
			</div>
		</section>
	);
}
