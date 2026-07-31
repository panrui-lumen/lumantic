import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DISPLAY_CURRENCIES } from "../../../shared/currency";
import {
	detectBrowserTimeFormat,
	detectBrowserTimezone,
	formatAppDateTime,
	isTimeFormatPreference,
	listTimeZones,
	resolveDateTimePrefs,
} from "../../../shared/datetime";
import {
	UI_LOCALE_META,
	UI_LOCALES,
	isUiLocalePreference,
	type UiLocalePreference,
} from "../../../shared/locale";
import { AlertIcon, CheckIcon, PencilIcon, SlackIcon, SpinnerIcon } from "../../components/Icons";
import { AvatarCropModal } from "./AvatarCropModal";
import { useAppAuth } from "./context";
import { useI18n, useT } from "./i18n";
import { UserAvatar } from "./UserAvatar";
import { ErrorBanner, SettingRow, Toggle, inputClass, Modal, Select } from "./ui";
import type { AppUser } from "./types";

const TIMEZONE_OPTIONS = listTimeZones();
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
						className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium text-violet-300/60 transition hover:text-violet-100 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!canDelete || deleting}
						className="flex cursor-pointer items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{deleting && <SpinnerIcon className="size-4" />}
						{deleting ? "Deleting…" : "Delete account"}
					</button>
				</div>
			</form>
		</Modal>
	);
}

function SelectControl({
	label,
	value,
	disabled,
	onChange,
	children,
	className = "min-w-[14rem]",
}: {
	label: string;
	value: string;
	disabled?: boolean;
	onChange: (value: string) => void;
	children: ReactNode;
	className?: string;
}) {
	return (
		<label className="inline-flex shrink-0">
			<Select
				aria-label={label}
				value={value}
				disabled={disabled}
				onChange={(e) => onChange(e.target.value)}
				wrapperClassName={className}
			>
				{children}
			</Select>
		</label>
	);
}

function FieldSaveStatus({
	field,
	savingField,
	savedField,
}: {
	field: string;
	savingField: string | null;
	savedField: string | null;
}) {
	const t = useT();
	if (savingField === field) {
		return (
			<span className="flex items-center gap-1 text-[11px] text-violet-400/55" aria-live="polite">
				<SpinnerIcon className="size-3" />
				{t("common.saving")}
			</span>
		);
	}
	if (savedField === field) {
		return (
			<span className="flex items-center gap-1 text-[11px] text-violet-300/65" aria-live="polite">
				<CheckIcon className="size-3 text-emerald-400/90" />
				{t("common.saved")}
			</span>
		);
	}
	return null;
}


export function AccountPage() {
	const { user, updateProfile, connectSlackIdentity, disconnectSlackIdentity } = useAppAuth();
	const t = useT();
	const { detectedLocale } = useI18n();
	const fileRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState(user?.name ?? "");
	const [role, setRole] = useState(user?.role ?? "");
	const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingField, setSavingField] = useState<string | null>(null);
	const [savedField, setSavedField] = useState<string | null>(null);
	const savedTimerRef = useRef<number | null>(null);
	const [slackBusy, setSlackBusy] = useState(false);
	const [error, setError] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		if (!user) return;
		setName(user.name);
		setRole(user.role);
		setAvatarUrl(user.avatarUrl ?? null);
	}, [user]);

	useEffect(() => {
		return () => {
			if (savedTimerRef.current != null) window.clearTimeout(savedTimerRef.current);
		};
	}, []);

	if (!user) return null;

	const slackUsername = user.slackUsername?.trim() || null;
	const browserTimeFormat = detectBrowserTimeFormat();
	const browserTimezone = detectBrowserTimezone();
	const resolvedPrefs = resolveDateTimePrefs({
		timeFormat: user.timeFormat ?? "auto",
		timezone: user.timezone ?? "auto",
	});
	const previewStamp = formatAppDateTime(new Date(), resolvedPrefs, {
		dateStyle: "full",
		timeStyle: "short",
	});

	async function patchPrefs(patch: Partial<AppUser>, field: string) {
		setSavingField(field);
		setSavedField(null);
		setError("");
		try {
			await updateProfile(patch);
			setSavedField(field);
			if (savedTimerRef.current != null) window.clearTimeout(savedTimerRef.current);
			savedTimerRef.current = window.setTimeout(() => {
				setSavedField((current) => (current === field ? null : current));
			}, 1800);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update preferences");
		} finally {
			setSavingField((current) => (current === field ? null : current));
		}
	}

	async function handleSaveProfile(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !role.trim()) return;
		setSavingProfile(true);
		setError("");
		try {
			await updateProfile({ name: name.trim(), role: role.trim(), avatarUrl });
			toast.success("Profile updated");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save profile");
		} finally {
			setSavingProfile(false);
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

	if (confirmDelete) {
		return <DeleteAccountModal onBack={() => setConfirmDelete(false)} onClose={() => setConfirmDelete(false)} />;
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

	return (
		<div className="h-full overflow-y-auto">
			<div className="border-b border-violet-500/10 px-6 py-5">
				<h1 className="font-display text-xl font-semibold text-violet-50">{t("account.title")}</h1>
				<p className="mt-1 text-sm text-violet-300/60">{t("account.description")}</p>
			</div>

			<div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
				{error && <ErrorBanner message={error} />}

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
						{t("account.profile")}
					</h2>
					<form
						onSubmit={handleSaveProfile}
						className="space-y-4 rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5"
					>
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
										className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-white/[0.04]"
									>
										<PencilIcon className="size-3.5" />
										{avatarUrl ? "Change photo" : "Upload photo"}
									</button>
									{avatarUrl && (
										<button
											type="button"
											onClick={() => setAvatarUrl(null)}
											className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-400/60 transition hover:text-violet-100"
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
										<p className="mt-0.5 text-xs text-violet-300/60">Connected as @{slackUsername}</p>
									) : (
										<p className="mt-0.5 text-xs text-violet-300/60">
											Connect Slack so global chats can show your handle.
										</p>
									)}
								</div>
								{slackUsername ? (
									<button
										type="button"
										disabled={slackBusy}
										onClick={async () => {
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
										}}
										className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-300/70 transition hover:text-violet-100 disabled:opacity-50"
									>
										{slackBusy ? "…" : "Disconnect"}
									</button>
								) : (
									<button
										type="button"
										disabled={slackBusy}
										onClick={async () => {
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
										}}
										className="cursor-pointer rounded-lg border border-violet-500/25 px-2.5 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-white/[0.04] disabled:opacity-50"
									>
										{slackBusy ? "…" : "Connect"}
									</button>
								)}
							</div>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
							<button
								type="button"
								onClick={() => setConfirmDelete(true)}
								className="cursor-pointer text-xs font-medium text-rose-300/80 transition hover:text-rose-200"
							>
								Delete account
							</button>
							<button
								type="submit"
								disabled={savingProfile || !name.trim() || !role.trim()}
								className="flex cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{savingProfile ? <SpinnerIcon className="size-4" /> : <CheckIcon className="size-4" />}
								{savingProfile ? "Saving…" : t("common.save")}
							</button>
						</div>
					</form>
				</section>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
						{t("settings.display")}
					</h2>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-5 py-2">
						<SettingRow
							title={t("settings.language")}
							description={t("settings.languageDescription")}
							status={
								<FieldSaveStatus field="uiLocale" savingField={savingField} savedField={savedField} />
							}
							control={
								<SelectControl
									label={t("settings.language")}
									value={user.uiLocale}
									disabled={savingField === "uiLocale"}
									onChange={(value) => {
										if (!isUiLocalePreference(value)) return;
										void patchPrefs({ uiLocale: value as UiLocalePreference }, "uiLocale");
									}}
								>
									<option value="auto">
										{t("settings.languageAuto", {
											detected: UI_LOCALE_META[detectedLocale].nativeLabel,
										})}
									</option>
									{UI_LOCALES.map((code) => (
										<option key={code} value={code}>
											{t(
												code === "en-US"
													? "settings.languageEnUS"
													: code === "en-GB"
														? "settings.languageEnGB"
														: code === "de"
															? "settings.languageDe"
															: code === "es"
																? "settings.languageEs"
																: "settings.languageFr",
											)}
										</option>
									))}
								</SelectControl>
							}
						/>
						<SettingRow
							title={t("settings.currency")}
							description={t("settings.currencyDescription")}
							status={
								<FieldSaveStatus field="displayCurrency" savingField={savingField} savedField={savedField} />
							}
							control={
								<SelectControl
									label={t("settings.currency")}
									value={user.displayCurrency}
									disabled={savingField === "displayCurrency"}
									className="min-w-[11rem]"
									onChange={(value) => void patchPrefs({ displayCurrency: value }, "displayCurrency")}
								>
									{DISPLAY_CURRENCIES.map((c) => (
										<option key={c.code} value={c.code}>
											{c.code} · {c.name}
										</option>
									))}
								</SelectControl>
							}
						/>
						<SettingRow
							title={t("settings.timeFormat")}
							description={
								<>
									<p>
										Choose 12-hour or 24-hour clocks, or auto from this browser (
										{browserTimeFormat === "12h" ? "12-hour" : "24-hour"}).
									</p>
									<p className="mt-1.5 text-violet-400/50">
										Preview: <span className="text-violet-200/80">{previewStamp}</span>
									</p>
								</>
							}
							status={
								<FieldSaveStatus field="timeFormat" savingField={savingField} savedField={savedField} />
							}
							control={
								<SelectControl
									label={t("settings.timeFormat")}
									value={user.timeFormat}
									disabled={savingField === "timeFormat"}
									className="min-w-[11rem]"
									onChange={(value) => {
										if (!isTimeFormatPreference(value)) return;
										void patchPrefs({ timeFormat: value }, "timeFormat");
									}}
								>
									<option value="auto">
										Auto ({browserTimeFormat === "12h" ? "12-hour" : "24-hour"})
									</option>
									<option value="12h">12-hour</option>
									<option value="24h">24-hour</option>
								</SelectControl>
							}
						/>
						<SettingRow
							title={t("settings.timezone")}
							description={`Used for timestamps in chat and memories. Auto follows this browser (${browserTimezone}).`}
							status={
								<FieldSaveStatus field="timezone" savingField={savingField} savedField={savedField} />
							}
							control={
								<SelectControl
									label={t("settings.timezone")}
									value={user.timezone}
									disabled={savingField === "timezone"}
									className="min-w-[14rem] max-w-[16rem]"
									onChange={(value) => void patchPrefs({ timezone: value }, "timezone")}
								>
									<option value="auto">Auto ({browserTimezone})</option>
									{TIMEZONE_OPTIONS.map((zone) => (
										<option key={zone} value={zone}>
											{zone.replace(/_/g, " ")}
										</option>
									))}
								</SelectControl>
							}
						/>
					</div>
				</section>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
						{t("account.email")}
					</h2>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-5 py-2">
						<SettingRow
							title="Proposed memories"
							description="Email when Lumantic surfaces new memories waiting for review."
							status={
								<FieldSaveStatus field="emailProposedMemories" savingField={savingField} savedField={savedField} />
							}
							control={
								<Toggle
									checked={user.emailProposedMemories}
									disabled={savingField === "emailProposedMemories"}
									onChange={(checked) =>
										void patchPrefs({ emailProposedMemories: checked }, "emailProposedMemories")
									}
								/>
							}
						/>
						<SettingRow
							title="Daily digest"
							description="A morning summary of new memories and open proposed items."
							status={
								<FieldSaveStatus field="emailDailyDigest" savingField={savingField} savedField={savedField} />
							}
							control={
								<Toggle
									checked={user.emailDailyDigest}
									disabled={savingField === "emailDailyDigest"}
									onChange={(checked) => void patchPrefs({ emailDailyDigest: checked }, "emailDailyDigest")}
								/>
							}
						/>
						<SettingRow
							title="Team invites"
							description="Email when someone is invited to your workspace."
							status={
								<FieldSaveStatus field="emailTeamInvites" savingField={savingField} savedField={savedField} />
							}
							control={
								<Toggle
									checked={user.emailTeamInvites}
									disabled={savingField === "emailTeamInvites"}
									onChange={(checked) => void patchPrefs({ emailTeamInvites: checked }, "emailTeamInvites")}
								/>
							}
						/>
						<SettingRow
							title="Billing"
							description="Invoices, failed payments, and plan changes."
							status={
								<FieldSaveStatus field="emailBilling" savingField={savingField} savedField={savedField} />
							}
							control={
								<Toggle
									checked={user.emailBilling}
									disabled={savingField === "emailBilling"}
									onChange={(checked) => void patchPrefs({ emailBilling: checked }, "emailBilling")}
								/>
							}
						/>
					</div>
					<p className="mt-2 text-xs text-violet-400/45">Emails go to {user.username}.</p>
				</section>
			</div>
		</div>
	);
}
