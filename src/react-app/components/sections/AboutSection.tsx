import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const PILLARS = [
	{
		title: "Your cloud, your bill",
		detail: "Warehouse, orchestrator, storage and secrets live in your own accounts. We provision and configure via code, then hand over the keys. No hosting lock-in.",
	},
	{
		title: "An engineer embedded with you",
		detail: "Every engagement ships with a forward-deployed engineer who sits with your team and arbitrates the metric definitions your departments already disagree on.",
	},
	{
		title: "A standard, not a bespoke build",
		detail: "Every pipeline follows the same Bronze → Silver → Gold discipline (append-only, idempotent, tested and documented), so agents can be trusted the moment they're plugged in.",
	},
	{
		title: "A library that compounds",
		detail: "Metric and entity definitions confirmed for one company enrich a vertical ontology we bring to the next, so later engagements start most of the way there.",
	},
];

export function AboutSection() {
	return (
		<section id="company" className="relative border-t border-violet-500/10 py-28">
			<div className="mx-auto max-w-6xl px-6">
				<SectionHeading
					title="We build the data team growth-stage companies never get around to hiring"
					subtitle="Lumantic was founded by data and AI engineers who kept watching the same story play out: a company scales past its first few hires, the data stack sprawls across a dozen tools, and every question turns into a week of Slack archaeology."
					align="center"
				/>

				<Reveal delay={120} className="mx-auto mt-6 max-w-2xl text-center">
					<p className="text-violet-200/65">
						Instead of another BI layer bolted onto the mess, we build production-grade data infrastructure to a
						defined standard, then hand it to two AI agents that do the ongoing work of a data team: one that
						discovers, ingests, models, and validates every source of truth, and one that plans, queries,
						investigates, and reviews on behalf of the humans asking questions.
					</p>
				</Reveal>

				<div className="mt-14 grid gap-4 sm:grid-cols-2">
					{PILLARS.map((pillar, i) => (
						<Reveal key={pillar.title} delay={160 + i * 90}>
							<div className="h-full rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6 transition hover:border-violet-400/30 hover:bg-white/[0.035]">
								<div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-violet-500/10 font-mono text-xs text-violet-300 ring-1 ring-violet-400/20">
									{String(i + 1).padStart(2, "0")}
								</div>
								<h3 className="font-display text-base font-semibold text-violet-50">{pillar.title}</h3>
								<p className="mt-2 text-sm text-violet-300/60">{pillar.detail}</p>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
