import logo from "../../assets/lumantic-logo.png";
import { GlowCta } from "../GlowCta";
import { ArrowRight } from "../Icons";

export function Hero({ onRegisterClick }: { onRegisterClick: () => void }) {
	return (
		<section id="top" className="relative overflow-hidden pt-40 pb-28 sm:pt-48 sm:pb-36">
			<div aria-hidden className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="animate-pulse-glow absolute top-[-10%] left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px]" />
				<div className="animate-float-slow absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-violet-500/15 blur-[100px]" />
				<div className="animate-float absolute top-1/4 -right-16 h-80 w-80 rounded-full bg-violet-400/15 blur-[110px]" />
			</div>

			<div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr]">
				<div>
					<h1 className="font-display text-4xl leading-[1.08] font-semibold tracking-tight text-violet-50 sm:text-5xl lg:text-[3.4rem]">
						Your growth outpaced your <span className="text-glow bg-gradient-to-r from-violet-300 to-violet-400 bg-clip-text text-transparent">ability to build a data team</span>
					</h1>

					<p className="mt-6 max-w-xl text-lg text-violet-200/70">
						Product events, payments, databases, market APIs, and a graveyard of spreadsheets. Every fast-growing
						company ends up here. Lumantic is the AI-native data team that stitches it all back together.
					</p>

					<div className="mt-9 flex flex-wrap items-center gap-4">
						<GlowCta>
							<button
								onClick={onRegisterClick}
								className="group flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
							>
								Register interest
								<ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
							</button>
						</GlowCta>
						<a
							href="#problem"
							className="rounded-full border border-violet-400/20 px-6 py-3.5 text-sm font-medium text-violet-200/80 transition hover:border-violet-400/40 hover:text-violet-50"
						>
							See how it works
						</a>
					</div>
				</div>

				<div className="relative mx-auto flex h-80 w-80 items-center justify-center sm:h-96 sm:w-96">
					<div aria-hidden className="animate-spin-slow absolute inset-0 rounded-full border border-dashed border-violet-400/20" />
					<div aria-hidden className="absolute inset-8 rounded-full border border-violet-400/10" />

					{[0, 90, 180, 270].map((deg) => (
						<div
							key={deg}
							className="animate-spin-slow absolute inset-0"
							style={{ animationDuration: "16s", transform: `rotate(${deg}deg)` }}
						>
							<span className="absolute top-0 left-1/2 size-2 -translate-x-1/2 rounded-full bg-violet-300 shadow-[0_0_12px_4px_rgba(184,160,255,0.6)]" />
						</div>
					))}

					<div className="animate-float relative">
						<div aria-hidden className="animate-pulse-glow absolute inset-0 -m-8 rounded-full bg-violet-500/30 blur-[60px]" />
						<img src={logo} alt="Lumantic" className="relative h-48 w-48 drop-shadow-[0_0_50px_rgba(184,148,255,0.55)] sm:h-56 sm:w-56" />
					</div>
				</div>
			</div>
		</section>
	);
}
