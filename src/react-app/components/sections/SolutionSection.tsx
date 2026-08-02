import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";
import { ArrowRight } from "../Icons";

const OUTCOMES = [
	{
		title: "A warehouse you can trust",
		lines: [
			"Clean definitions your whole team shares.",
			"Cost controls built in.",
			"Ready for humans and for AI.",
			"In your cloud, under your keys.",
		],
	},
	{
		title: "A proactive Data Agent",
		lines: [
			"Ask in Slack — get the number, the root cause, and a next step.",
			"It also watches your metrics and flags issues before you ask.",
			"Like a senior data scientist on call 24/7 — and one who doesn't wait to be pinged.",
			"Without the headcount.",
		],
	},
];

export function SolutionSection() {
	return (
		<section id="product" className="relative border-t border-violet-500/10 bg-ink py-20 sm:py-24">
			<div className="relative mx-auto max-w-6xl px-6">
				<SectionHeading
					title="What Lumantic gives you"
					subtitle="One setup. Two outcomes that matter."
				/>

				<div className="mt-12 grid gap-8 sm:grid-cols-2">
					{OUTCOMES.map((item, i) => (
						<Reveal key={item.title} delay={i * 80}>
							<div className="h-full rounded-2xl border border-violet-500/15 bg-white/[0.02] p-7">
								<p className="font-mono text-[11px] tracking-wide text-violet-400/60">
									{String(i + 1).padStart(2, "0")}
								</p>
								<h3 className="font-display mt-3 text-xl font-semibold text-violet-50">{item.title}</h3>
								<ul className="mt-4 space-y-2 text-sm text-violet-300/65 sm:text-base">
									{item.lines.map((line) => (
										<li key={line}>{line}</li>
									))}
								</ul>
							</div>
						</Reveal>
					))}
				</div>

				<Reveal delay={140} className="mt-10">
					<a
						href="/how-it-works"
						className="group inline-flex items-center gap-2 text-sm font-medium text-violet-200/80 transition hover:text-violet-50"
					>
						Full walkthrough: how raw data becomes an answer
						<ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
					</a>
				</Reveal>
			</div>
		</section>
	);
}
