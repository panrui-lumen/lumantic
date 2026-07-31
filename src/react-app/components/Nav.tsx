import { useEffect, useState } from "react";
import logo from "../assets/lumantic-logo.png";
import { GlowCta } from "./GlowCta";

export function Nav({ onRegisterClick }: { onRegisterClick: () => void }) {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
				scrolled ? "border-b border-violet-500/15 bg-void/80 backdrop-blur-md" : "border-b border-transparent"
			}`}
		>
			<nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-6">
				<a href="#top" className="flex min-w-0 items-center gap-2.5">
					<img src={logo} alt="Lumantic" className="h-7 w-7 shrink-0 drop-shadow-[0_0_12px_rgba(184,148,255,0.6)]" />
					<span className="font-display text-lg font-semibold tracking-tight text-violet-50">Lumantic</span>
				</a>

				<div className="hidden items-center gap-8 text-sm text-violet-200/70 md:flex">
					<a href="#problem" className="transition hover:text-violet-50">
						Why Lumantic
					</a>
					<a href="#product" className="transition hover:text-violet-50">
						Product
					</a>
					<a href="#how-it-works" className="transition hover:text-violet-50">
						How it works
					</a>
				</div>

				<GlowCta>
					<button
						onClick={onRegisterClick}
						className="cursor-pointer rounded-full bg-ink px-3 py-2 text-sm font-medium whitespace-nowrap text-violet-100 transition hover:bg-violet-950 hover:text-white sm:px-4"
					>
						Register interest
					</button>
				</GlowCta>
			</nav>
		</header>
	);
}
