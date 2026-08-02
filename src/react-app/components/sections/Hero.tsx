import logo from "../../assets/lumantic-logo.png";
import { GlowCta } from "../GlowCta";
import { ArrowRight } from "../Icons";

export function Hero({ onRegisterClick }: { onRegisterClick: () => void }) {
	return (
		<section id="top" className="relative overflow-hidden pt-32 pb-16 sm:pt-44 sm:pb-24">
			<div aria-hidden className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_55%_50%_at_50%_0%,black,transparent)] opacity-60" />

			<div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:gap-10">
				<div className="min-w-0">
					<p className="text-sm font-medium tracking-wide text-violet-300/70">
						For growing companies without a data team
					</p>
					<h1 className="font-display mt-4 max-w-3xl text-[2rem] leading-[1.15] font-semibold tracking-tight text-violet-50 sm:text-5xl sm:leading-[1.1]">
						Messy data.
						<br />
						No data scientist.
						<br />
						Slow decisions.
					</h1>

					<ul className="mt-6 max-w-xl space-y-2 text-base text-violet-200/75 sm:text-lg">
						<li>Your numbers live in four tools — and none of them agree.</li>
						<li>Every question turns into a Slack thread, not an answer.</li>
						<li>Hiring a data scientist takes months and six figures.</li>
					</ul>
					<p className="mt-5 max-w-xl text-base font-medium text-violet-100 sm:text-lg">
						Lumantic builds a warehouse you can trust.
						<br />
						And a Data Agent that answers like a senior data scientist — in Slack, in 2 weeks.
					</p>

					<div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
						<GlowCta>
							<button
								onClick={onRegisterClick}
								className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
							>
								Register interest
								<ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
							</button>
						</GlowCta>
						<a
							href="#looks-like"
							className="inline-flex items-center justify-center rounded-full border border-violet-400/20 px-6 py-3.5 text-sm font-medium text-violet-200/80 transition hover:border-violet-400/40 hover:text-violet-50"
						>
							See what you get
						</a>
					</div>
				</div>

				<div className="relative mx-auto flex h-48 w-48 shrink-0 items-center justify-center sm:h-64 sm:w-64 lg:mx-0 lg:justify-self-end">
					<div aria-hidden className="animate-spin-slow absolute inset-0 rounded-full border border-dashed border-violet-400/20" />
					<div aria-hidden className="absolute inset-6 rounded-full border border-violet-400/10" />

					{[0, 90, 180, 270].map((deg) => (
						<div
							key={deg}
							className="animate-spin-slow absolute inset-0"
							style={{ animationDuration: "16s", transform: `rotate(${deg}deg)` }}
						>
							<span className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-violet-300 shadow-[0_0_10px_3px_rgba(184,160,255,0.55)]" />
						</div>
					))}

					<div className="animate-float relative">
						<div aria-hidden className="animate-pulse-glow absolute inset-0 -m-6 rounded-full bg-violet-500/25 blur-[50px]" />
						<img
							src={logo}
							alt="Lumantic"
							className="relative h-28 w-28 drop-shadow-[0_0_40px_rgba(156,123,255,0.5)] sm:h-36 sm:w-36"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
