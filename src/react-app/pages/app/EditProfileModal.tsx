import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertIcon, PencilIcon, SlackIcon, SpinnerIcon } from "../../components/Icons";
import { useAppAuth } from "./context";
import { AvatarCropModal } from "./AvatarCropModal";
import { UserAvatar } from "./UserAvatar";
import { inputClass, Modal } from "./ui";
import type { AppUser } from "./types";

const DELETE_CONFIRMATION = "delete my account";

function DeleteAccountModal({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
	const { deleteAccount } = useAppAuth();
	const [confirmation, setConfirmation] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");

	const canDelete = confirmation.trim() === DELETE_CONFIRMATION;

	async function handleDelete(e: React.FormEvent) {
		e.preventDefault();
		if (!canDelete || deleting) return;
		setDeleting(true);
		setError("");
		try {
			await deleteAccount(confirmation.trim());
			toast.success("Account deleted");
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete account");
			setDeleting(false);
		}
	}

	return (
		<Modal title="Delete account?" onClose={onBack}>
			<form onSubmit={handleDelete} className="flex flex-col gap-4">
				<p className="text-sm leading-relaxed text-violet-200/80">
					This signs you out and removes access to this workspace. Type{" "}
					<strong className="font-semibold text-violet-50">{DELETE_CONFIRMATION}</strong> to confirm.
				</p>
				<div>
					<label className="mb-1.5 block text-xs font-medium text-violet-300/70">Confirmation</label>
					<input
						value={confirmation}
						onChange={(e) => setConfirmation(e.target.value)}
						autoFocus
						autoComplete="off"
						spellCheck={false}
						placeholder={DELETE_CONFIRMATION}
						className={inputClass}
					/>
				</div>

				{error && (
					<p className="flex items-center gap-1.5 text-sm text-rose-300">
						<AlertIcon className="size-4 shrink-0" />
						{error}
					</p>
				)}

				<div className="mt-1 flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onBack}
						disabled={deleting}
						className="rounded-lg px-3.5 py-2 text-sm font-medium text-violet-300/60 transition hover:text-violet-100 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!canDelete || deleting}
						className="flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{deleting && <SpinnerIcon className="size-4" />}
						{deleting ? "Deleting…" : "Delete account"}
					</button>
				</div>
			</form>
		</Modal>
	);
}

export function EditProfileModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
	const { updateProfile, connectSlackIdentity, disconnectSlackIdentity, user: liveUser } = useAppAuth();
	const fileRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState(user.name);
	const [role, setRole] = useState(user.role);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [slackBusy, setSlackBusy] = useState(false);
	const [error, setError] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);

	const slackUsername = (liveUser?.slackUsername ?? user.slackUsername)?.trim() || null;

	if (confirmDelete) {
		return <DeleteAccountModal onBack={() => setConfirmDelete(false)} onClose={onClose} />;
	}

	if (cropSrc) {
		return (
			<AvatarCropModal
				imageSrc={cropSrc}
				onCancel={() => {
					URL.revokeObjectURL(cropSrc);
					setCropSrc(null);
				}}
				onComplete={(dataUrl) => {
					URL.revokeObjectURL(cropSrc);
					setAvatarUrl(dataUrl);
					setCropSrc(null);
				}}
			/>
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !role.trim()) return;
		setSaving(true);
		setError("");
		try {
			await updateProfile({ name: name.trim(), role: role.trim(), avatarUrl });
			toast.success("Profile updated");
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save changes");
		} finally {
			setSaving(false);
		}
	}

	async function handleConnectSlack() {
		setSlackBusy(true);
		setError("");
		try {
			await connectSlackIdentity();
			toast.success("Slack connected");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't connect Slack");
		} finally {
			setSlackBusy(false);
		}
	}

	async function handleDisconnectSlack() {
		setSlackBusy(true);
		setError("");
		try {
			await disconnectSlackIdentity();
			toast.success("Slack disconnected");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't disconnect Slack");
		} finally {
			setSlackBusy(false);
		}
	}

	function handleFileChange(file: File | null) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setError("Please choose an image file.");
			return;
		}
		if (file.size > 8 * 1024 * 1024) {
			setError("Image must be under 8 MB.");
			return;
		}
		setError("");
		setCropSrc(URL.createObjectURL(file));
	}

	return (
		<Modal title="Edit profile" onClose={onClose}>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex items-center gap-4">
					<UserAvatar name={name || user.name} avatarUrl={avatarUrl} sizeClass="size-16" textClass="text-lg" />
					<div className="min-w-0 flex-1 space-y-2">
						<p className="text-xs font-medium text-violet-300/70">Profile photo</p>
						<div className="flex flex-wrap items-center gap-2">
							<input
								ref={fileRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									handleFileChange(e.target.files?.[0] ?? null);
									e.target.value = "";
								}}
							/>
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-white/[0.04]"
							>
								<PencilIcon className="size-3.5" />
								{avatarUrl ? "Change photo" : "Upload photo"}
							</button>
							{avatarUrl && (
								<button
									type="button"
									onClick={() => setAvatarUrl(null)}
									className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-400/60 transition hover:text-violet-100"
								>
									Remove
								</button>
							)}
						</div>
					</div>
				</div>

				<div>
					<label className="mb-1.5 block text-xs font-medium text-violet-300/70">Name</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						autoFocus
						maxLength={80}
						className={inputClass}
					/>
				</div>
				<div>
					<label className="mb-1.5 block text-xs font-medium text-violet-300/70">Role</label>
					<input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} className={inputClass} />
				</div>

				<div className="rounded-xl border border-violet-500/15 bg-white/[0.02] p-3">
					<div className="flex items-start gap-3">
						<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
							<SlackIcon className="size-5" />
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-violet-50">Slack</p>
							{slackUsername ? (
								<p className="mt-0.5 text-xs text-violet-300/60">
									Connected as <span className="font-medium text-violet-200">@{slackUsername}</span>. Global Slack chats
									from this handle show as you.
								</p>
							) : (
								<p className="mt-0.5 text-xs text-violet-300/60">
									Connect Slack to pull your username so we can label your global Slack chats as you.
								</p>
							)}
							{slackUsername ? (
								<button
									type="button"
									onClick={handleDisconnectSlack}
									disabled={slackBusy}
									className="mt-2.5 text-xs font-medium text-violet-400/70 transition hover:text-violet-100 disabled:opacity-50"
								>
									{slackBusy ? "Working…" : "Disconnect Slack"}
								</button>
							) : (
								<button
									type="button"
									onClick={handleConnectSlack}
									disabled={slackBusy}
									className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#4A154B]/40 bg-white px-3 py-2 text-xs font-semibold text-[#1D1C1D] transition hover:bg-[#F8F8F8] disabled:cursor-not-allowed disabled:opacity-60"
								>
									{slackBusy ? <SpinnerIcon className="size-3.5 text-[#4A154B]" /> : <SlackIcon className="size-3.5" />}
									{slackBusy ? "Connecting…" : "Connect with Slack"}
								</button>
							)}
						</div>
					</div>
				</div>

				{error && (
					<p className="flex items-center gap-1.5 text-sm text-rose-300">
						<AlertIcon className="size-4 shrink-0" />
						{error}
					</p>
				)}

				<div className="mt-1 flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-3.5 py-2 text-sm font-medium text-violet-300/60 transition hover:text-violet-100"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={saving || !name.trim() || !role.trim()}
						className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{saving && <SpinnerIcon className="size-4" />}
						{saving ? "Saving…" : "Save changes"}
					</button>
				</div>

				<div className="mt-2 border-t border-violet-500/15 pt-4">
					<p className="mb-2 text-xs font-medium tracking-wide text-violet-400/50 uppercase">Danger zone</p>
					<button
						type="button"
						onClick={() => setConfirmDelete(true)}
						className="w-full rounded-lg border border-rose-500/25 px-3.5 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10"
					>
						Delete account
					</button>
				</div>
			</form>
		</Modal>
	);
}
