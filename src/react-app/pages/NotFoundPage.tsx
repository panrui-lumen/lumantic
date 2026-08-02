import logo from "../assets/lumantic-logo.png";

const KNOWN_APP_PREFIXES = [
	"/app/memories",
	"/app/proposed",
	"/app/team",
	"/app/billing",
	"/app/support",
	"/app/settings",
	"/app/login",
	"/app/register",
] as const;

/** True when the SPA has a real page for this pathname (not a soft 404). */
export function isKnownSitePath(pathname: string): boolean {
	const path = pathname.replace(/\/+$/, "") || "/";
	if (path === "/") return true;
	if (path === "/how-it-works") return true;
	if (path === "/status") return true;
	if (path === "/admin" || path.startsWith("/admin/")) return true;
	if (path === "/app") return true;
	if (KNOWN_APP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return true;
	if (/^\/s\/[a-z0-9]+$/i.test(path)) return true;
	return false;
}

export function NotFoundPage() {
	const path = window.location.pathname;

	return (
		<div className="relative flex min-h-screen flex-col overflow-hidden bg-void text-violet-50">
			<div
				className="pointer-events-none absolute top-[-10%] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]"
				aria-hidden
			/>
			<header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
				<a href="/" className="flex cursor-pointer items-center gap-2.5">
					<img src={logo} alt="Lumantic" className="h-7 w-7 drop-shadow-[0_0_12px_rgba(184,148,255,0.6)]" />
					<span className="font-display text-lg font-semibold tracking-tight text-violet-50">Lumantic</span>
				</a>
			</header>

			<main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
				<p className="font-display text-7xl font-semibold tracking-tight text-violet-400/40 sm:text-8xl">404</p>
				<h1 className="mt-4 font-display text-2xl font-semibold text-violet-50 sm:text-3xl">Page not found</h1>
				<p className="mt-3 text-sm leading-relaxed text-violet-300/60">
					No page exists at <span className="font-mono text-violet-200/80">{path}</span>. It may have moved, or the
					link is incomplete.
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<a
						href="/"
						className="cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
					>
						Go to homepage
					</a>
				</div>
			</main>
		</div>
	);
}
