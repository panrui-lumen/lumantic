import { useCallback, useEffect, useState } from "react";
import logo from "../assets/lumantic-logo.png";
import {
	AlertIcon,
	CheckIcon,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	LockIcon,
	LogOutIcon,
	MailIcon,
	SearchIcon,
	SpinnerIcon,
} from "../components/Icons";

const STORAGE_KEY = "lumantic_admin_password";
const PAGE_SIZE = 12;

type Registration = { id: number; email: string; created_at: string };
type Sort = "newest" | "oldest";
type BannerState = { enabled: boolean; message: string; updatedAt: string | null };

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}

function LoginScreen({ onSuccess }: { onSuccess: (password: string) => void }) {
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});
			if (!res.ok) {
				setError("Incorrect password");
				return;
			}
			onSuccess(password);
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="bg-grid flex min-h-screen items-center justify-center bg-void px-4">
			<div className="pointer-events-none fixed top-1/2 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow rounded-full bg-violet-600/15 blur-[120px]" />

			<form
				onSubmit={handleSubmit}
				className="relative w-full max-w-sm rounded-2xl border border-violet-500/20 bg-ink p-8 shadow-[0_0_80px_-15px_rgba(143,99,248,0.4)]"
			>
				<div className="flex flex-col items-center text-center">
					<img src={logo} alt="Lumantic" className="h-10 w-10 drop-shadow-[0_0_16px_rgba(184,148,255,0.6)]" />
					<h1 className="mt-4 font-display text-lg font-semibold text-violet-50">Admin access</h1>
					<p className="mt-1 text-sm text-violet-300/60">Enter the admin password to manage the site.</p>
				</div>

				<div className="relative mt-6">
					<LockIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-violet-400/50" />
					<input
						type="password"
						autoFocus
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						className="w-full rounded-xl border border-violet-500/25 bg-white/[0.03] py-3 pr-4 pl-10 text-sm text-violet-50 transition outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
					/>
				</div>

				{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

				<button
					type="submit"
					disabled={loading || !password}
					className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading && <SpinnerIcon className="size-4" />}
					{loading ? "Checking…" : "Sign in"}
				</button>
			</form>
		</div>
	);
}

function SiteBannerPanel({ password, onUnauthorized }: { password: string; onUnauthorized: () => void }) {
	const [enabled, setEnabled] = useState(false);
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/admin/site-banner", {
					headers: { "x-admin-password": password },
				});
				if (cancelled) return;
				if (res.status === 401) {
					onUnauthorized();
					return;
				}
				if (!res.ok) throw new Error("Failed to load");
				const data = (await res.json()) as BannerState;
				if (cancelled) return;
				setEnabled(Boolean(data.enabled));
				setMessage(data.message ?? "");
				setError("");
			} catch {
				if (!cancelled) setError("Couldn't load site banner settings.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [password, onUnauthorized]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError("");
		setSaved(false);
		try {
			const res = await fetch("/api/admin/site-banner", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"x-admin-password": password,
				},
				body: JSON.stringify({ enabled, message }),
			});
			if (res.status === 401) {
				onUnauthorized();
				return;
			}
			const data = (await res.json()) as BannerState & { error?: string };
			if (!res.ok) {
				setError(data.error ?? "Couldn't save banner.");
				return;
			}
			setEnabled(Boolean(data.enabled));
			setMessage(data.message ?? "");
			setSaved(true);
			window.dispatchEvent(new Event("lumantic-site-banner-changed"));
		} catch {
			setError("Couldn't save banner. Try again.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<section className="mb-10 rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5 sm:p-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="font-display text-lg font-semibold text-violet-50">Sitewide banner</h2>
					<p className="mt-1 text-sm text-violet-300/60">
						Show a notice across the marketing site and app (outages, maintenance, etc.).
					</p>
				</div>
				{loading ? <SpinnerIcon className="size-4 text-violet-400/50" /> : null}
			</div>

			<form onSubmit={handleSave} className="mt-5 space-y-4">
				<label className="flex cursor-pointer items-center gap-3 text-sm text-violet-100">
					<button
						type="button"
						role="switch"
						aria-checked={enabled}
						disabled={loading}
						onClick={() => setEnabled((v) => !v)}
						className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
							enabled
								? "border-amber-400/40 bg-amber-500/40"
								: "border-violet-500/25 bg-white/[0.04]"
						} disabled:cursor-not-allowed disabled:opacity-50`}
					>
						<span
							className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition ${
								enabled ? "translate-x-5" : "translate-x-0"
							}`}
						/>
					</button>
					<span>{enabled ? "Banner is on" : "Banner is off"}</span>
				</label>

				<div>
					<label htmlFor="site-banner-message" className="mb-1.5 block text-xs font-medium text-violet-300/70">
						Banner text
					</label>
					<textarea
						id="site-banner-message"
						value={message}
						onChange={(e) => {
							setMessage(e.target.value);
							setSaved(false);
						}}
						disabled={loading}
						rows={3}
						maxLength={500}
						placeholder="e.g. Scheduled maintenance Saturday 02:00-04:00 UTC. Chat may be briefly unavailable."
						className="w-full resize-y rounded-xl border border-violet-500/20 bg-white/[0.03] px-3.5 py-2.5 text-sm text-violet-50 outline-none transition placeholder:text-violet-400/35 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
					/>
					<p className="mt-1.5 text-[11px] text-violet-400/45">{message.length}/500</p>
				</div>

				{enabled && message.trim() ? (
					<div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-50">
						<p className="mb-1 text-[11px] font-semibold tracking-wide text-amber-200/70 uppercase">Preview</p>
						<p className="flex items-start gap-2">
							<AlertIcon className="mt-0.5 size-4 shrink-0 text-amber-200/90" />
							<span className="whitespace-pre-wrap">{message.trim()}</span>
						</p>
					</div>
				) : null}

				{error ? <p className="text-sm text-rose-300">{error}</p> : null}

				<div className="flex flex-wrap items-center gap-3">
					<button
						type="submit"
						disabled={loading || saving}
						className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{saving ? <SpinnerIcon className="size-4" /> : null}
						{saving ? "Saving…" : "Save banner"}
					</button>
					{saved ? (
						<span className="inline-flex items-center gap-1.5 text-sm text-emerald-300/80">
							<CheckIcon className="size-3.5" />
							Saved
						</span>
					) : null}
				</div>
			</form>
		</section>
	);
}

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
	const [rows, setRows] = useState<Registration[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState<Sort>("newest");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(t);
	}, [search]);

	const pageResetKey = `${sort}\0${debouncedSearch}`;
	const [pageResetSource, setPageResetSource] = useState(pageResetKey);
	if (pageResetKey !== pageResetSource) {
		setPageResetSource(pageResetKey);
		setPage(1);
	}

	const fetchKey = `${page}\0${sort}\0${debouncedSearch}`;
	const [fetchKeySource, setFetchKeySource] = useState(fetchKey);
	if (fetchKey !== fetchKeySource) {
		setFetchKeySource(fetchKey);
		setLoading(true);
	}

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const params = new URLSearchParams({
					page: String(page),
					pageSize: String(PAGE_SIZE),
					sort: sort === "oldest" ? "oldest" : "newest",
				});
				if (debouncedSearch) params.set("q", debouncedSearch);

				const res = await fetch(`/api/admin/registrations?${params.toString()}`, {
					headers: { "x-admin-password": password },
				});
				if (cancelled) return;
				if (res.status === 401) {
					onLogout();
					return;
				}
				if (!res.ok) throw new Error("Failed to load");
				const data = (await res.json()) as { rows: Registration[]; total: number };
				if (cancelled) return;
				setRows(data.rows);
				setTotal(data.total);
				setError("");
			} catch {
				if (!cancelled) setError("Couldn't load registrations. Try refreshing.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [page, sort, debouncedSearch, password, onLogout]);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div className="min-h-screen bg-void text-violet-50">
			<header className="border-b border-violet-500/10 bg-ink/60">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
					<div className="flex items-center gap-2.5">
						<img src={logo} alt="Lumantic" className="h-7 w-7" />
						<div>
							<h1 className="font-display text-base font-semibold text-violet-50">Admin</h1>
							<p className="text-xs text-violet-400/50">Registrations and site banner</p>
						</div>
					</div>
					<button
						onClick={onLogout}
						className="flex items-center gap-2 rounded-full border border-violet-500/20 px-4 py-2 text-sm text-violet-300/70 transition hover:border-violet-400/40 hover:text-violet-50"
					>
						<LogOutIcon className="size-4" />
						Log out
					</button>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-6 py-10">
				<SiteBannerPanel password={password} onUnauthorized={onLogout} />

				<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="font-display text-2xl font-semibold text-violet-50">
							{total}{" "}
							<span className="text-base font-normal text-violet-300/60">
								registered {total === 1 ? "email" : "emails"}
							</span>
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="relative">
							<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-400/50" />
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search email…"
								className="w-52 rounded-lg border border-violet-500/20 bg-white/[0.03] py-2 pr-3 pl-9 text-sm text-violet-50 transition outline-none placeholder:text-violet-400/40 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
							/>
						</div>

						<div className="relative">
							<select
								value={sort}
								onChange={(e) => setSort(e.target.value as Sort)}
								className="appearance-none rounded-lg border border-violet-500/20 bg-white/[0.03] py-2 pr-9 pl-3 text-sm text-violet-100 transition outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
							>
								<option value="newest" className="bg-ink">
									Newest first
								</option>
								<option value="oldest" className="bg-ink">
									Oldest first
								</option>
							</select>
							<ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-violet-400/50" />
						</div>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02]">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-violet-500/10 text-xs tracking-wide text-violet-400/60 uppercase">
								<th className="px-5 py-3.5 font-medium">Email</th>
								<th className="px-5 py-3.5 font-medium">Registered</th>
								<th className="px-5 py-3.5 text-right font-medium">Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={3} className="px-5 py-14 text-center text-violet-300/50">
										<SpinnerIcon className="mx-auto size-5" />
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={3} className="px-5 py-14 text-center text-rose-300">
										{error}
									</td>
								</tr>
							) : rows.length === 0 ? (
								<tr>
									<td colSpan={3} className="px-5 py-14 text-center text-violet-300/50">
										No registrations {debouncedSearch ? "match your search" : "yet"}.
									</td>
								</tr>
							) : (
								rows.map((row) => (
									<tr
										key={row.id}
										className="border-b border-violet-500/5 transition last:border-0 hover:bg-white/[0.02]"
									>
										<td className="px-5 py-3.5 text-violet-100">{row.email}</td>
										<td className="px-5 py-3.5 font-mono text-xs text-violet-300/60">{formatDate(row.created_at)}</td>
										<td className="px-5 py-3.5 text-right">
											<a
												href={`mailto:${row.email}`}
												aria-label={`Email ${row.email}`}
												title={`Email ${row.email}`}
												className="inline-flex size-8 items-center justify-center rounded-full text-violet-300/70 transition hover:bg-violet-500/15 hover:text-violet-100"
											>
												<MailIcon />
											</a>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="mt-6 flex items-center justify-between text-sm text-violet-300/60">
					<p>
						Page {page} of {totalPages}
					</p>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page <= 1}
							className="flex size-9 items-center justify-center rounded-lg border border-violet-500/20 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
						>
							<ChevronLeft />
						</button>
						<button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page >= totalPages}
							className="flex size-9 items-center justify-center rounded-lg border border-violet-500/20 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
						>
							<ChevronRight />
						</button>
					</div>
				</div>
			</main>
		</div>
	);
}

export function AdminPage() {
	const [password, setPassword] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY));

	const handleLogout = useCallback(() => {
		sessionStorage.removeItem(STORAGE_KEY);
		setPassword(null);
	}, []);

	const handleSuccess = (pw: string) => {
		sessionStorage.setItem(STORAGE_KEY, pw);
		setPassword(pw);
	};

	if (!password) return <LoginScreen onSuccess={handleSuccess} />;

	return <Dashboard password={password} onLogout={handleLogout} />;
}
