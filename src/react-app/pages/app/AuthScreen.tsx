import { useState } from "react";
import logo from "../../assets/lumantic-logo.png";
import {
	AlertIcon,
	ArrowRight,
	LockIcon,
	MailIcon,
	SlackIcon,
	SparkleIcon,
	SpinnerIcon,
	UserIcon,
} from "../../components/Icons";
import { ApiError, useAppAuth } from "./context";
import { Tooltip } from "./ui";

type Tab = "login" | "register";

function FieldShell({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
	return (
		<div className="relative">
			<span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-violet-400/50">{icon}</span>
			{children}
		</div>
	);
}

const inputClass =
	"w-full rounded-xl border border-violet-500/25 bg-white/[0.03] py-3 pr-4 pl-10 text-sm text-violet-50 outline-none transition placeholder:text-violet-400/40 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25";

function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
	const { login } = useAppAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			await login(username, password);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<Tooltip content="Coming soon">
				<span className="block w-full">
					<button
						type="button"
						aria-disabled="true"
						onClick={(e) => e.preventDefault()}
						className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#1D1C1D] transition hover:bg-white/95"
					>
						<SlackIcon className="size-5" />
						Sign in with Slack
					</button>
				</span>
			</Tooltip>

			<div className="flex items-center gap-3">
				<span className="h-px flex-1 bg-violet-500/20" />
				<span className="text-[11px] font-medium tracking-wide text-violet-400/45 uppercase">or</span>
				<span className="h-px flex-1 bg-violet-500/20" />
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<FieldShell icon={<MailIcon className="size-4" />}>
					<input
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Email"
						type="email"
						autoFocus
						autoComplete="username"
						className={inputClass}
						disabled={loading}
					/>
				</FieldShell>
				<FieldShell icon={<LockIcon className="size-4" />}>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						autoComplete="current-password"
						className={inputClass}
						disabled={loading}
					/>
				</FieldShell>

				{error && (
					<p className="flex items-center gap-1.5 text-sm text-rose-300">
						<AlertIcon className="size-4 shrink-0" />
						{error}
					</p>
				)}

				<button
					type="submit"
					disabled={loading || !username || !password}
					className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading && <SpinnerIcon className="size-4" />}
					{loading ? "Signing in…" : "Sign in"}
				</button>

				<p className="text-center text-xs text-violet-400/50">
					No account?{" "}
					<button
						type="button"
						onClick={onSwitchToRegister}
						className="font-medium text-violet-300 hover:text-violet-100"
					>
						Request access
					</button>
				</p>
			</form>
		</div>
	);
}

function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [company, setCompany] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		setNotice("");
		try {
			const res = await fetch("/api/app/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, company, password }),
			});
			const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
			if (!res.ok) {
				setError(data.error ?? "Something went wrong. Please try again.");
				return;
			}
			setNotice(data.message ?? "Thanks! We'll be in touch.");
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	if (notice) {
		return (
			<div className="flex flex-col gap-4 text-center">
				<div className="mx-auto flex size-11 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
					<SparkleIcon className="size-5" />
				</div>
				<p className="text-sm leading-relaxed text-violet-200/80">{notice}</p>
				<button
					type="button"
					onClick={onSwitchToLogin}
					className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
				>
					Go to sign in
					<ArrowRight className="size-4" />
				</button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<FieldShell icon={<UserIcon className="size-4" />}>
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Full name"
					autoFocus
					className={inputClass}
				/>
			</FieldShell>
			<FieldShell icon={<MailIcon className="size-4" />}>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Work email"
					className={inputClass}
				/>
			</FieldShell>
			<FieldShell icon={<SparkleIcon className="size-4" />}>
				<input
					value={company}
					onChange={(e) => setCompany(e.target.value)}
					placeholder="Company"
					className={inputClass}
				/>
			</FieldShell>
			<FieldShell icon={<LockIcon className="size-4" />}>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Password"
					className={inputClass}
				/>
			</FieldShell>

			{error && (
				<p className="flex items-center gap-1.5 text-sm text-rose-300">
					<AlertIcon className="size-4 shrink-0" />
					{error}
				</p>
			)}

			<button
				type="submit"
				disabled={loading || !name || !email || !company || !password}
				className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading && <SpinnerIcon className="size-4" />}
				{loading ? "Requesting access…" : "Request access"}
			</button>

			<p className="text-center text-xs text-violet-400/50">
				Already have access?{" "}
				<button type="button" onClick={onSwitchToLogin} className="font-medium text-violet-300 hover:text-violet-100">
					Sign in
				</button>
			</p>
		</form>
	);
}

export function AuthScreen() {
	const [tab, setTab] = useState<Tab>("login");

	return (
		<div className="bg-grid relative flex min-h-screen items-center justify-center bg-void px-4 py-10">
			<div className="pointer-events-none fixed top-1/2 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow rounded-full bg-violet-600/15 blur-[120px]" />

			<div className="relative w-full max-w-sm rounded-2xl border border-violet-500/20 bg-ink p-8 shadow-[0_0_80px_-15px_rgba(143,99,248,0.4)]">
				<div className="flex flex-col items-center text-center">
					<img src={logo} alt="Lumantic" className="h-10 w-10 drop-shadow-[0_0_16px_rgba(184,148,255,0.6)]" />
					<h1 className="mt-4 font-display text-lg font-semibold text-violet-50">
						{tab === "login" ? "Welcome back" : "Request access"}
					</h1>
					<p className="mt-1 text-sm text-violet-300/60">
						{tab === "login"
							? "Sign in to your Lumantic workspace."
							: "Lumantic is invite-only during our private beta."}
					</p>
				</div>

				<div className="mt-6 mb-5 grid grid-cols-2 gap-1 rounded-xl border border-violet-500/15 bg-white/[0.02] p-1 text-sm font-medium">
					<button
						onClick={() => setTab("login")}
						className={`rounded-lg py-2 transition ${
							tab === "login" ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
						}`}
					>
						Sign in
					</button>
					<button
						onClick={() => setTab("register")}
						className={`rounded-lg py-2 transition ${
							tab === "register" ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
						}`}
					>
						Register
					</button>
				</div>

				{tab === "login" ? (
					<LoginForm onSwitchToRegister={() => setTab("register")} />
				) : (
					<RegisterForm onSwitchToLogin={() => setTab("login")} />
				)}
			</div>
		</div>
	);
}
