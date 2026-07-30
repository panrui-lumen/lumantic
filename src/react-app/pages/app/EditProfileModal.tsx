import { useState } from "react";
import { toast } from "sonner";
import { AlertIcon, SpinnerIcon } from "../../components/Icons";
import { useAppAuth } from "./context";
import { inputClass, Modal } from "./ui";
import type { AppUser } from "./types";

export function EditProfileModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
	const { updateProfile } = useAppAuth();
	const [name, setName] = useState(user.name);
	const [role, setRole] = useState(user.role);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !role.trim()) return;
		setSaving(true);
		setError("");
		try {
			await updateProfile({ name: name.trim(), role: role.trim() });
			toast.success("Profile updated");
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save changes");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Modal title="Edit profile" onClose={onClose}>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div>
					<label className="mb-1.5 block text-xs font-medium text-violet-300/70">Name</label>
					<input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={80} className={inputClass} />
				</div>
				<div>
					<label className="mb-1.5 block text-xs font-medium text-violet-300/70">Role</label>
					<input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} className={inputClass} />
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
			</form>
		</Modal>
	);
}
