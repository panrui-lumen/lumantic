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
		label: "DE Agent",
		items: ["Discover", "Ingest", "Model", "Validate"],
		accent: true,
	},
	{
		label: "Governed data plane",
		items: ["Warehouse", "Semantics", "Lineage", "Freshness"],
		accent: false,
		wide: true,
	},
	{
		label: "DA Agent",
		items: ["Plan", "Query", "Investigate", "Review"],
		accent: true,
	},
	{
		label: "Slack",
		items: ["Growth", "Product", "Finance", "Strategy"],
		accent: false,
		icon: "slack" as const,
	},
];

function FlowConnector({ vertical = false }: { vertical?: boolean }) {
	return (
		<div
			className={
				vertical
					? "relative mx-auto h-8 w-px overflow-hidden bg-violet-500/15 lg:hidden"
					: "relative hidden h-px flex-1 self-center overflow-hidden bg-violet-500/15 lg:block"
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

			<div className="relative mx-auto max-w-6xl px-6">
				<SectionHeading
					title="Lumantic is your first data team"
					subtitle="Two specialized agents share one trusted contract, from raw source to Slack answer, with no data specialist in the loop."
					align="center"
				/>

				<div className="mt-16 flex flex-col items-stretch gap-0 lg:flex-row lg:items-center">
					{PIPELINE.map((node, i) => (
						<div key={node.label} className="contents lg:flex lg:flex-1 lg:items-center">
							<Reveal delay={i * 100} className={node.wide ? "lg:flex-[1.3]" : "flex-1"}>
								<div
									className={`relative h-full rounded-2xl border p-5 text-center transition ${
										node.accent
											? "border-violet-400/40 bg-violet-500/10 shadow-[0_0_40px_-15px_rgba(132,87,246,0.8)]"
											: "border-violet-500/15 bg-white/[0.02]"
									}`}
								>
									<h3 className="font-display inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-violet-50">
										{"icon" in node && node.icon === "slack" && <SlackIcon className="size-3.5" />}
										{node.label}
									</h3>
									<ul className="mt-3 space-y-1">
										{node.items.map((item) => (
											<li key={item} className="font-mono text-[11px] text-violet-300/60">
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
						<h3 className="font-display text-lg font-semibold text-violet-50">Business users</h3>
						<p className="mt-3 text-sm text-violet-200/70">Provide access · Define metrics · Make decisions</p>
						<p className="mt-4 inline-block rounded-full bg-violet-500/15 px-4 py-1.5 font-mono text-xs tracking-wide text-violet-200 ring-1 ring-violet-400/30">
							No data specialist required
						</p>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
