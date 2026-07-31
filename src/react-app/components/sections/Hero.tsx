import logo from "../../assets/lumantic-logo.png";
import { GlowCta } from "../GlowCta";
import { ArrowRight } from "../Icons";

const PAIN_POINTS = ["Growing fast.", "Messy data.", "No data team.", "Slow answers."] as const;

export function Hero({ onRegisterClick }: { onRegisterClick: () => void }) {
	return (
		<section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-48 sm:pb-36">
			<div aria-hidden className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="animate-pulse-glow absolute top-[-10%] left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px]" />
				<div className="animate-float-slow absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-violet-500/15 blur-[100px]" />
				<div className="animate-float absolute top-1/4 -right-16 h-80 w-80 rounded-full bg-violet-400/15 blur-[110px]" />
			</div>

			<div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.7fr)] lg:gap-8">
				<div className="min-w-0">
					<h1 className="font-display tracking-tight">
						<span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[1.15rem] leading-[1.35] font-medium text-violet-200/55 sm:text-2xl lg:flex-nowrap lg:gap-x-2.5 lg:text-[1.45rem] xl:text-[1.65rem]">
							{PAIN_POINTS.map((phrase, i) => (
								<span key={phrase} className="inline-flex shrink-0 items-center gap-2">
									{i > 0 ? (
										<span className="text-violet-500/35" aria-hidden>
											·
										</span>
									) : null}
									<span className="text-violet-100/90">{phrase}</span>
								</span>
							))}
						</span>
						<span className="mt-5 block text-[1.7rem] leading-[1.2] font-semibold text-violet-50 sm:text-[2.5rem] sm:leading-[1.15] lg:text-[2.85rem] xl:text-[3.2rem]">
							<span className="text-glow bg-gradient-to-r from-violet-300 to-violet-400 bg-clip-text text-transparent">
								Lumantic fixes all three in 2&nbsp;months
							</span>{" "}
							to help you grow even faster.
						</span>
					</h1>

					<p className="mt-6 max-w-xl text-base text-violet-200/70 sm:text-lg">
						We build and run your data warehouse — human-ready, AI-ready, and cost-effective. Our trained Data Agent
						watches it 24/7, continuously learns, and answers your team's questions with high accuracy and a broad
						knowledge base.
					</p>

					<div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
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
							href="#problem"
							className="inline-flex items-center justify-center rounded-full border border-violet-400/20 px-6 py-3.5 text-center text-sm font-medium text-violet-200/80 transition hover:border-violet-400/40 hover:text-violet-50"
						>
							See how it works
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
						<div aria-hidden className="animate-pulse-glow absolute inset-0 -m-6 rounded-full bg-violet-500/30 blur-[50px]" />
						<img
							src={logo}
							alt="Lumantic"
							className="relative h-28 w-28 drop-shadow-[0_0_40px_rgba(156,123,255,0.55)] sm:h-36 sm:w-36"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
