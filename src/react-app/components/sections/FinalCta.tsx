import { GlowCta } from "../GlowCta";
import { Reveal } from "../Reveal";
import { ArrowRight } from "../Icons";

export function FinalCta({ onRegisterClick }: { onRegisterClick: () => void }) {
	return (
		<section className="relative border-t border-violet-500/10 py-20 sm:py-24">
			<Reveal className="relative mx-auto max-w-3xl px-6 text-center">
				<h2 className="font-display text-3xl font-semibold tracking-tight text-violet-50 sm:text-4xl">
					Trusted data.
					<br />
					Fast answers.
					<br />
					No data team to hire.
				</h2>
				<p className="mx-auto mt-5 text-base text-violet-200/65">
					Live in 2 weeks.
					<br />
					Register your interest and we'll be in touch.
				</p>
				<GlowCta className="mt-8">
					<button
						onClick={onRegisterClick}
						className="group flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-7 py-4 text-sm font-semibold text-white transition hover:brightness-110"
					>
						Register interest
						<ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
					</button>
				</GlowCta>
			</Reveal>
		</section>
	);
}
