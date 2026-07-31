import logo from "../assets/lumantic-logo.png";

export function Footer() {
	return (
		<footer className="relative border-t border-violet-500/10 bg-ink">
			<div className="mx-auto max-w-6xl px-6 py-14">
				<div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
					<div className="flex items-center gap-2.5">
						<img src={logo} alt="Lumantic" className="h-6 w-6 opacity-90" />
						<span className="font-display text-base font-semibold text-violet-50">Lumantic</span>
					</div>

					<p className="max-w-md text-sm text-violet-300/50">All you need is Lumantic.</p>
				</div>

				<div className="mt-10 border-t border-violet-500/10 pt-6 text-xs text-violet-400/40">
					<p>© {new Date().getFullYear()} Lumantic.</p>
				</div>
			</div>
		</footer>
	);
}
