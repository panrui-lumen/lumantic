import { SpinnerIcon } from "./Icons";

type ConfirmTone = "danger" | "default";

export function ConfirmModal({
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	tone = "danger",
	busy = false,
	onConfirm,
	onClose,
}: {
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: ConfirmTone;
	busy?: boolean;
	onConfirm: () => void | Promise<void>;
	onClose: () => void;
}) {
	const confirmClass =
		tone === "danger"
			? "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
			: "bg-violet-600 text-white hover:brightness-110";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close"
				className="absolute inset-0 cursor-pointer bg-black/60"
				onClick={onClose}
				disabled={busy}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirm-modal-title"
				className="relative z-10 w-full max-w-sm rounded-2xl border border-violet-500/20 bg-ink p-5 shadow-2xl"
			>
				<h3 id="confirm-modal-title" className="font-display text-lg font-semibold text-violet-50">
					{title}
				</h3>
				<p className="mt-2 text-sm leading-relaxed text-violet-200/80">{description}</p>
				<div className="mt-5 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						disabled={busy}
						className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:bg-white/[0.04] hover:text-violet-100 disabled:opacity-50"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={() => void onConfirm()}
						disabled={busy}
						className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
					>
						{busy ? <SpinnerIcon className="size-4" /> : null}
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
