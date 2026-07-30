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
			<nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<a href="#top" className="flex items-center gap-2.5">
					<img src={logo} alt="Lumantic" className="h-7 w-7 drop-shadow-[0_0_12px_rgba(184,148,255,0.6)]" />
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
					<a href="#company" className="transition hover:text-violet-50">
						Company
					</a>
				</div>

				<GlowCta>
					<button
						onClick={onRegisterClick}
						className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-950 hover:text-white"
					>
						Register interest
					</button>
				</GlowCta>
			</nav>
		</header>
	);
}
