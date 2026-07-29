import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const ARTIFACTS = [
	{
		label: "Users API",
		lines: ["usr_7f31", "country GB", "mobile_web · iOS"],
	},
	{
		label: "Payment webhook",
		lines: ["evt_pay_01988", "attempt dep_a91", "failed · 3DS_TIMEOUT"],
	},
	{
		label: "Release log",
		lines: ["web-2.14", "deployed 00:17Z", "new hosted 3DS handoff"],
	},
	{
		label: "Slack request",
		lines: ["diagnose", "deposit conversion", "15-21 Jul vs 8-14 Jul"],
	},
];

const IDS = ["evt_pay_01988", "dep_a91", "usr_7f31", "web-2.14", "3DS_TIMEOUT"];

export function WorkedExample() {
	return (
		<section id="how-it-works" className="relative border-t border-violet-500/10 py-28">
			<div className="mx-auto max-w-6xl px-6">
				<SectionHeading
					title="One incident gives us an end-to-end implementation trace"
					subtitle="The deck never changes examples: every artifact below explains this same failure path."
					align="center"
				/>

				<Reveal delay={100} className="mx-auto mt-14 max-w-xl">
					<div className="relative rounded-2xl border border-violet-400/30 bg-violet-500/10 px-6 py-5 text-center shadow-[0_0_50px_-15px_rgba(132,87,246,0.7)]">
						<span className="font-mono text-[10px] tracking-[0.2em] text-violet-300/70 uppercase">Worked example</span>
						<p className="font-display mt-2 text-lg text-violet-50 sm:text-xl">Why did deposit conversion fall last week?</p>
					</div>
				</Reveal>

				<div className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div aria-hidden className="absolute top-1/2 right-0 left-0 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-500/25 to-transparent lg:block" />
					{ARTIFACTS.map((a, i) => (
						<Reveal key={a.label} delay={i * 100}>
							<div className="relative flex h-full flex-col rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
								<span className="mb-3 inline-flex w-fit items-center rounded-full bg-violet-500/10 px-2.5 py-1 font-mono text-[10px] tracking-wide text-violet-300/70 uppercase ring-1 ring-violet-400/20">
									{a.label}
								</span>
								<div className="mt-auto space-y-1.5 font-mono text-[13px]">
									{a.lines.map((line, li) => (
										<p key={line} className={li === 0 ? "text-violet-100" : "text-violet-300/55"}>
											{line}
										</p>
									))}
								</div>
							</div>
						</Reveal>
					))}
				</div>

				<Reveal delay={400} className="mt-10">
					<div className="flex flex-wrap items-center justify-center gap-2.5">
						{IDS.map((id) => (
							<span
								key={id}
								className="animate-pulse-glow rounded-full border border-violet-400/25 bg-violet-500/[0.06] px-3.5 py-1.5 font-mono text-xs text-violet-200/80"
								style={{ animationDelay: `${IDS.indexOf(id) * 0.3}s` }}
							>
								{id}
							</span>
						))}
					</div>
				</Reveal>

				<Reveal delay={480}>
					<p className="mt-8 text-center text-xs text-violet-400/40">
						All records, vendors, releases, and results are synthetic.
					</p>
				</Reveal>
			</div>
		</section>
	);
}
