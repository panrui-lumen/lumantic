import { GlowCta } from "../GlowCta";
import { Reveal } from "../Reveal";
import { ArrowRight } from "../Icons";

export function FinalCta({ onRegisterClick }: { onRegisterClick: () => void }) {
	return (
		<section className="relative overflow-hidden border-t border-violet-500/10 py-28">
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="animate-pulse-glow absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
			</div>

			<Reveal className="relative mx-auto max-w-3xl px-6 text-center">
				<h2 className="font-display text-3xl font-semibold tracking-tight text-violet-50 sm:text-4xl">
					Give your company its first data team
				</h2>
				<p className="mx-auto mt-4 max-w-xl text-violet-200/65">
					We're onboarding a small group of early design partners before opening Lumantic up more broadly. Register
					your interest and we'll be in touch.
				</p>
				<GlowCta className="mt-9">
					<button
						onClick={onRegisterClick}
						className="group flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-400 px-7 py-4 text-sm font-semibold text-white transition hover:brightness-110"
					>
						Register interest
						<ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
					</button>
				</GlowCta>
			</Reveal>
		</section>
	);
}
