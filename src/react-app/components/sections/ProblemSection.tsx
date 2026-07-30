import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const SYSTEMS = [
	{ name: "Analytics events", detail: "signups · activation" },
	{ name: "Webhooks", detail: "payment attempts · outcomes" },
	{ name: "Database", detail: "users · orders" },
	{ name: "Market APIs", detail: "competitor data · market activity" },
];

const QUESTIONS = [
	{ tag: "Growth", question: "How are signups, activations and churn?" },
	{ tag: "Product", question: "Why did deposits fall, which funnel step should we optimize?" },
	{ tag: "Experimentation", question: "How is our new feature performing, should we roll out to all users?" },
	{ tag: "Strategy", question: "Where should we expand, which markets should we enter?" },
];

export function ProblemSection() {
	return (
		<section id="problem" className="relative border-t border-violet-500/10 py-28">
			<div className="mx-auto max-w-6xl px-6">
				<SectionHeading
					title="Your data lives in four places. Your answers live in none of them."
					subtitle="Events, webhooks, databases, and APIs each hold part of the picture — but without a proper warehouse and someone who knows it inside out, every question becomes a manual investigation."
				/>

				<div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SYSTEMS.map((system, i) => (
						<Reveal key={system.name} delay={i * 80}>
							<div className="group h-full rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6 transition hover:border-violet-400/35 hover:bg-white/[0.04]">
								<div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 font-mono text-sm text-violet-300 ring-1 ring-violet-400/20 transition group-hover:bg-violet-500/20">
									{String(i + 1).padStart(2, "0")}
								</div>
								<h3 className="font-display text-base font-semibold text-violet-50">{system.name}</h3>
								<p className="mt-1.5 font-mono text-xs text-violet-300/60">{system.detail}</p>
							</div>
						</Reveal>
					))}
				</div>

				<div className="mt-24 grid gap-12 lg:grid-cols-2 lg:items-center">
					<Reveal>
						<span className="font-mono text-[11px] tracking-[0.2em] text-violet-400/70 uppercase">Questions keep arriving</span>
						<h3 className="font-display mt-3 text-2xl font-semibold text-violet-50 sm:text-3xl">
							Teams need answers now. Hiring a senior data scientist takes months.
						</h3>
						<p className="mt-4 text-violet-200/65">
							Growth, product, and strategy all ask the same questions — but without a trusted warehouse and someone
							who can interpret it, every request turns into a Slack thread instead of a clear answer.
						</p>
					</Reveal>

					<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
						{QUESTIONS.map((q, i) => (
							<Reveal key={q.tag} delay={i * 100}>
								<div className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-br from-white/[0.03] to-transparent p-5">
									<span className="font-mono text-[10px] tracking-[0.16em] text-violet-400/70 uppercase">{q.tag}</span>
									<p className="mt-2 font-display text-lg text-violet-50">"{q.question}"</p>
								</div>
							</Reveal>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
