import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const SYSTEMS = [
	{ name: "Product events", detail: "signups · activation" },
	{ name: "Payments", detail: "attempts · outcomes" },
	{ name: "Database", detail: "users · market activity" },
	{ name: "Market APIs", detail: "liquidity · competition" },
];

const QUESTIONS = [
	{ tag: "Growth", question: "How are signups?" },
	{ tag: "Product", question: "Why did deposits fall?" },
	{ tag: "Strategy", question: "Where should we expand?" },
];

export function ProblemSection() {
	return (
		<section id="problem" className="relative border-t border-violet-500/10 py-28">
			<div className="mx-auto max-w-6xl px-6">
				<SectionHeading
					title="Four systems. No owner. No shared definitions."
					subtitle="Every fast-growing company scatters its truth across tools that were never meant to talk to each other."
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
							Every team needs answers. Nobody owns the data system.
						</h3>
						<p className="mt-4 text-violet-200/65">
							Growth, product, and strategy all ask the same warehouse for different truths, and today, all three get
							a Slack thread instead of an answer.
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
