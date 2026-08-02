import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const PAINS = [
	{
		title: "Data is scattered",
		lines: ["Events in one tool.", "Payments in another.", "Spreadsheets everywhere.", "Nothing agrees."],
	},
	{
		title: "Nobody owns the answers",
		lines: ["Growth asks one question.", "Product asks another.", "Finance asks a third.", "You get a Slack thread."],
	},
	{
		title: "Hiring is too slow",
		lines: ["A senior data hire takes months.", "It costs six figures.", "Decisions can't wait.", "Gut feel fills the gap."],
	},
];

export function ProblemSection() {
	return (
		<section id="problem" className="relative border-t border-violet-500/10 py-20 sm:py-24">
			<div className="mx-auto max-w-6xl px-6">
				<SectionHeading
					title="The cost of waiting for a data team"
					subtitle="If this sounds familiar, you don't need to hire your way out of it."
				/>

				<div className="mt-12 grid gap-8 sm:grid-cols-3">
					{PAINS.map((pain, i) => (
						<Reveal key={pain.title} delay={i * 60}>
							<div className="h-full border-l border-violet-400/25 pl-5">
								<p className="font-mono text-[11px] tracking-wide text-violet-400/60">
									{String(i + 1).padStart(2, "0")}
								</p>
								<h3 className="font-display mt-2 text-lg font-semibold text-violet-50">{pain.title}</h3>
								<ul className="mt-3 space-y-1.5 text-sm text-violet-300/65">
									{pain.lines.map((line) => (
										<li key={line}>{line}</li>
									))}
								</ul>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
