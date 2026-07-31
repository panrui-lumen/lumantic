import { useEffect, useRef, useState } from "react";
import { GlowCta } from "./GlowCta";
import { CheckIcon, CloseIcon, SpinnerIcon } from "./Icons";

type Status = "idle" | "loading" | "success" | "error";

export function RegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [errorMessage, setErrorMessage] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;

	function reset() {
		setEmail("");
		setStatus("idle");
		setErrorMessage("");
	}

	function handleClose() {
		onClose();
		setTimeout(reset, 200);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setStatus("loading");
		setErrorMessage("");
		try {
			const res = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = (await res.json()) as { ok?: boolean; error?: string };
			if (!res.ok || !data.ok) {
				setStatus("error");
				setErrorMessage(data.error ?? "Something went wrong. Please try again.");
				return;
			}
			setStatus("success");
		} catch {
			setStatus("error");
			setErrorMessage("Network error. Please try again.");
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4"
			role="dialog"
			aria-modal="true"
			aria-label="Register interest"
		>
			<button
				aria-label="Close"
				onClick={handleClose}
				className="absolute inset-0 animate-[rise_0.3s_ease-out] bg-void/80 backdrop-blur-sm"
			/>

			<div className="relative w-full max-w-md animate-rise overflow-hidden rounded-2xl border border-violet-500/25 bg-ink shadow-[0_0_80px_-10px_rgba(143,99,248,0.5)]">
				<div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-violet-500/30 blur-[70px]" />

				<button
					onClick={handleClose}
					aria-label="Close dialog"
					className="absolute top-4 right-4 z-10 rounded-full p-1.5 text-violet-300/70 transition hover:bg-white/5 hover:text-white"
				>
					<CloseIcon />
				</button>

				<div className="relative px-7 pt-8 pb-7 sm:px-9 sm:pt-9 sm:pb-8">
					{status === "success" ? (
						<div className="flex flex-col items-center py-4 text-center">
							<div className="mb-5 flex size-14 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30">
								<CheckIcon className="size-7" />
							</div>
							<h3 className="font-display text-xl font-semibold text-violet-50">You're on the list</h3>
							<p className="mt-2 text-sm text-violet-200/70">
								We'll reach out at <span className="text-violet-100">{email}</span> as soon as early access opens up.
							</p>
							<button
								onClick={handleClose}
								className="mt-7 rounded-full bg-violet-500/15 px-5 py-2 text-sm font-medium text-violet-100 ring-1 ring-violet-400/30 transition hover:bg-violet-500/25"
							>
								Done
							</button>
						</div>
					) : (
						<>
							<h3 className="font-display text-xl font-semibold text-violet-50 sm:text-2xl">Register your interest</h3>
							<p className="mt-2 text-sm text-violet-200/70">
								Leave your email and we'll let you know the moment Lumantic is ready for your team.
							</p>

							<form onSubmit={handleSubmit} className="mt-6">
								<label
									htmlFor="register-email"
									className="mb-2 block text-xs font-medium tracking-wide text-violet-300/80 uppercase"
								>
									Email
								</label>
								<input
									ref={inputRef}
									id="register-email"
									type="email"
									required
									autoComplete="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@email.com"
									className="w-full rounded-xl border border-violet-500/25 bg-white/[0.03] px-4 py-3 text-sm text-violet-50 transition outline-none placeholder:text-violet-300/40 focus:border-violet-400/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/25"
								/>

								{status === "error" && <p className="mt-2 text-sm text-rose-300">{errorMessage}</p>}

								<GlowCta className="mt-5" fullWidth rounded="rounded-xl">
									<button
										type="submit"
										disabled={status === "loading"}
										className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
									>
										{status === "loading" && <SpinnerIcon className="size-4" />}
										{status === "loading" ? "Submitting…" : "Register interest"}
									</button>
								</GlowCta>

								<p className="mt-4 text-center text-xs text-violet-300/50">No spam. Just one email when we launch.</p>
							</form>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
