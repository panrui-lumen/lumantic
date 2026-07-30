import { SlackIcon } from "../Icons";
import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const PIPELINE = [
	{
		label: "Sources",
		items: ["Events", "Payments", "Database", "APIs"],
		accent: false,
	},
	{
		label: "Warehouse build",
		items: ["Discover", "Ingest", "Model", "Validate"],
		accent: true,
	},
	{
		label: "Human & AI ready",
		items: ["Warehouse", "Semantics", "Lineage", "Cost controls"],
		accent: false,
	},
	{
		label: "Data Agent",
		items: ["Monitor 24/7", "Query", "Investigate", "Answer"],
		accent: true,
	},
	{
		label: "Slack",
		items: ["Growth", "Product", "Finance", "Strategy"],
		accent: false,
		icon: "slack" as const,
	},
	{
		label: "Impact",
		items: ["Faster decisions", "Trusted metrics", "Root causes", "More growth"],
		accent: true,
	},
];

function FlowConnector({ vertical = false }: { vertical?: boolean }) {
	return (
		<div
			className={
				vertical
					? "relative mx-auto h-8 w-px overflow-hidden bg-violet-500/15 lg:hidden"
					: "relative hidden h-px w-6 shrink-0 self-center overflow-hidden bg-violet-500/15 lg:block"
			}
		>
			<span
				className={
					vertical
						? "absolute left-1/2 h-3 w-px -translate-x-1/2 animate-[flow-y_1.6s_linear_infinite] bg-gradient-to-b from-transparent via-violet-300 to-transparent"
						: "absolute top-1/2 h-px w-10 -translate-y-1/2 animate-[flow-x_1.6s_linear_infinite] bg-gradient-to-r from-transparent via-violet-300 to-transparent"
				}
				style={{ boxShadow: "0 0 8px 1px rgba(184,160,255,0.7)" }}
			/>
		</div>
	);
}

export function SolutionSection() {
	return (
		<section id="product" className="relative border-t border-violet-500/10 bg-ink py-28">
			<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute top-1/2 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[140px]" />
			</div>

			<div className="relative mx-auto max-w-7xl px-6">
				<SectionHeading
					title="Lumantic is your first and forever data team."
					subtitle="We build and maintain a warehouse your team and AI tools can trust — cost-effectively. Our trained Data Agent watches it 24/7 and answers questions with the accuracy and breadth of a senior data scientist."
					align="center"
				/>

				<div className="mt-16 flex flex-col items-stretch gap-0 lg:flex-row lg:items-stretch lg:gap-0">
					{PIPELINE.map((node, i) => (
						<div key={node.label} className="contents lg:contents">
							<Reveal delay={i * 100} className="w-full lg:min-w-0 lg:flex-1">
								<div
									className={`relative flex h-full min-w-0 flex-col items-center justify-center rounded-2xl border px-4 py-6 text-center transition sm:px-5 ${
										node.accent
											? "border-violet-400/40 bg-violet-500/10 shadow-[0_0_40px_-15px_rgba(143,99,248,0.8)]"
											: "border-violet-500/15 bg-white/[0.02]"
									}`}
								>
									<h3 className="font-display inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-semibold text-violet-50">
										{"icon" in node && node.icon === "slack" && <SlackIcon className="size-3.5 shrink-0" />}
										{node.label}
									</h3>
									<ul className="mt-3 space-y-1.5">
										{node.items.map((item) => (
											<li key={item} className="whitespace-nowrap font-mono text-[11px] text-violet-300/60">
												{item}
											</li>
										))}
									</ul>
								</div>
							</Reveal>
							{i < PIPELINE.length - 1 && (
								<>
									<FlowConnector />
									<FlowConnector vertical />
								</>
							)}
						</div>
					))}
				</div>

				<div className="mt-4 flex justify-center lg:hidden">
					<div className="h-8 w-px bg-gradient-to-b from-violet-500/30 to-violet-500/0" />
				</div>

				<Reveal delay={200} className="mx-auto mt-2 max-w-3xl">
					<div className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/10 to-transparent p-7 text-center">
						<h3 className="font-display text-lg font-semibold text-violet-50">Your team asks. The Data Agent answers.</h3>
						<p className="mt-3 text-sm text-violet-200/70">Ask in Slack · Get accurate answers · Make decisions faster</p>
						<p className="mt-4 inline-block rounded-full bg-violet-500/15 px-4 py-1.5 font-mono text-xs tracking-wide text-violet-200 ring-1 ring-violet-400/30">
							Like having a senior data scientist on call 24/7
						</p>
					</div>
				</Reveal>

				<Reveal delay={280} className="mx-auto mt-8 max-w-4xl">
					<div className="rounded-2xl border border-dashed border-violet-400/20 bg-white/[0.015] px-6 py-5 text-center">
						<span className="font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">Coming soon</span>
						<p className="mt-2 text-sm text-violet-300/55">
							Automated experimentation · Dashboarding · Alerting · Monitoring · Proactive product analysis
						</p>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
