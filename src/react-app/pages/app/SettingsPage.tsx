import { useEffect, useState } from "react";
import { CheckIcon, ChevronDown, HashIcon, LinkIcon, PencilIcon, SlackIcon, SpinnerIcon } from "../../components/Icons";
import { EditProfileModal } from "./EditProfileModal";
import { useAppAuth } from "./context";
import { ErrorBanner, initials, inputClass, SettingRow, Toggle } from "./ui";
import type { SlackChannel, SlackSettings } from "./types";

function ConnectSlackCard({ onConnect }: { onConnect: () => Promise<void> }) {
	const [connecting, setConnecting] = useState(false);

	return (
		<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6">
			<div className="flex flex-col items-center gap-3 py-6 text-center">
				<span className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.04]">
					<SlackIcon className="size-7" />
				</span>
				<div>
					<p className="font-medium text-violet-50">Connect your company's Slack</p>
					<p className="mx-auto mt-1 max-w-sm text-sm text-violet-300/60">
						Allow talking with the Lumantic agent in your company's Slack channels, proposed memories, etc.
					</p>
				</div>
				<button
					onClick={async () => {
						setConnecting(true);
						try {
							await onConnect();
						} finally {
							setConnecting(false);
						}
					}}
					disabled={connecting}
					className="mt-2 flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{connecting ? <SpinnerIcon className="size-4" /> : <LinkIcon className="size-4" />}
					{connecting ? "Connecting…" : "Connect to Slack"}
				</button>
			</div>
		</div>
	);
}

function ConnectedSlackCard({
	settings,
	channels,
	onDisconnect,
	onUpdate,
}: {
	settings: SlackSettings;
	channels: SlackChannel[];
	onDisconnect: () => Promise<void>;
	onUpdate: (patch: Partial<{ botName: string; defaultChannelId: string; postProposedMemories: boolean; postDailyDigest: boolean; notifyOnNewMemory: boolean }>) => Promise<void>;
}) {
	const [botName, setBotName] = useState(settings.botName);
	const [disconnecting, setDisconnecting] = useState(false);
	const [savingField, setSavingField] = useState<string | null>(null);

	useEffect(() => setBotName(settings.botName), [settings.botName]);

	async function saveField(key: string, patch: Parameters<typeof onUpdate>[0]) {
		setSavingField(key);
		try {
			await onUpdate(patch);
		} finally {
			setSavingField(null);
		}
	}

	return (
		<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<span className="flex size-11 items-center justify-center rounded-xl bg-white/[0.04]">
						<SlackIcon className="size-6" />
					</span>
					<div>
						<p className="flex items-center gap-2 font-medium text-violet-50">
							{settings.workspaceName}
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
								<span className="size-1.5 rounded-full bg-emerald-400" />
								Connected
							</span>
						</p>
						<p className="text-xs text-violet-400/50">Updated {new Date(settings.updatedAt.endsWith("Z") ? settings.updatedAt : `${settings.updatedAt}Z`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
					</div>
				</div>
				<button
					onClick={async () => {
						setDisconnecting(true);
						try {
							await onDisconnect();
						} finally {
							setDisconnecting(false);
						}
					}}
					disabled={disconnecting}
					className="rounded-lg border border-rose-500/25 px-3.5 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
				>
					{disconnecting ? "Disconnecting…" : "Disconnect"}
				</button>
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<label className="block">
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Bot name</span>
					<div className="flex gap-2">
						<input value={botName} onChange={(e) => setBotName(e.target.value)} className={inputClass} />
						<button
							onClick={() => saveField("botName", { botName })}
							disabled={savingField === "botName" || !botName.trim() || botName === settings.botName}
							className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-500/20 px-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/40 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{savingField === "botName" ? <SpinnerIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
						</button>
					</div>
				</label>

				<label className="block">
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Default channel</span>
					<div className="relative">
						<HashIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-violet-400/50" />
						<select
							value={settings.defaultChannelId ?? ""}
							onChange={(e) => saveField("channel", { defaultChannelId: e.target.value })}
							disabled={savingField === "channel"}
							className={`${inputClass} appearance-none pr-8 pl-8`}
						>
							{channels.map((c) => (
								<option key={c.id} value={c.id} className="bg-ink">
									{c.name}
									{c.is_private ? " (private)" : ""}
								</option>
							))}
						</select>
						<ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-violet-400/50" />
					</div>
				</label>
			</div>

			<div className="mt-2 divide-y divide-violet-500/10">
				<SettingRow
					title="Post proposed memories for review"
					description="Send new AI-proposed memories to the channel so the team can approve them from Slack too."
					control={
						<Toggle
							checked={settings.postProposedMemories}
							disabled={savingField === "postProposedMemories"}
							onChange={(checked) => saveField("postProposedMemories", { postProposedMemories: checked })}
						/>
					}
				/>
				<SettingRow
					title="Send daily digest"
					description="A short daily recap of what changed across memories and conversations."
					control={
						<Toggle
							checked={settings.postDailyDigest}
							disabled={savingField === "postDailyDigest"}
							onChange={(checked) => saveField("postDailyDigest", { postDailyDigest: checked })}
						/>
					}
				/>
				<SettingRow
					title="Notify on new confirmed memory"
					description="Post a message whenever a memory is approved, whether by you or a teammate."
					control={
						<Toggle
							checked={settings.notifyOnNewMemory}
							disabled={savingField === "notifyOnNewMemory"}
							onChange={(checked) => saveField("notifyOnNewMemory", { notifyOnNewMemory: checked })}
						/>
					}
				/>
			</div>
		</div>
	);
}

export function SettingsPage() {
	const { user, request } = useAppAuth();
	const [settings, setSettings] = useState<SlackSettings | null>(null);
	const [channels, setChannels] = useState<SlackChannel[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showEditProfile, setShowEditProfile] = useState(false);

	function load() {
		return request<{ settings: SlackSettings; channels: SlackChannel[] }>("/slack").then((data) => {
			setSettings(data.settings);
			setChannels(data.channels);
		});
	}

	useEffect(() => {
		load()
			.catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"))
			.finally(() => setLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function handleConnect() {
		const data = await request<{ settings: SlackSettings }>("/slack/connect", {
			method: "POST",
			body: JSON.stringify({}),
		});
		setSettings(data.settings);
		const chans = await request<{ settings: SlackSettings; channels: SlackChannel[] }>("/slack");
		setChannels(chans.channels);
	}

	async function handleDisconnect() {
		const data = await request<{ settings: SlackSettings }>("/slack/disconnect", { method: "POST" });
		setSettings(data.settings);
	}

	async function handleUpdate(patch: Record<string, unknown>) {
		const data = await request<{ settings: SlackSettings }>("/slack", { method: "PUT", body: JSON.stringify(patch) });
		setSettings(data.settings);
	}

	return (
		<div className="h-full overflow-y-auto">
			<div className="border-b border-violet-500/10 px-6 py-5">
				<h1 className="font-display text-xl font-semibold text-violet-50">Settings</h1>
				<p className="mt-1 text-sm text-violet-300/60">Connect Slack to talk with Lumantic in your company channels.</p>
			</div>

			<div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
				{error && <ErrorBanner message={error} />}

				{user && (
					<button
						type="button"
						onClick={() => setShowEditProfile(true)}
						className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4 text-left transition hover:border-violet-400/40 hover:bg-white/[0.04]"
					>
						<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-semibold text-white">
							{initials(user.name)}
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-violet-50">{user.name}</p>
							<p className="text-xs text-violet-400/50">
								{user.role} · {user.company}
							</p>
						</div>
						<span className="flex items-center gap-1.5 text-xs font-medium text-violet-400/50 transition group-hover:text-violet-200">
							<PencilIcon className="size-3.5" />
							Edit
						</span>
					</button>
				)}

				{showEditProfile && user && <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} />}

				{loading ? (
					<div className="flex justify-center py-16">
						<SpinnerIcon className="size-5 text-violet-400" />
					</div>
				) : settings ? (
					<section>
						<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Slack integration</h2>
						{settings.connected ? (
							<ConnectedSlackCard settings={settings} channels={channels} onDisconnect={handleDisconnect} onUpdate={handleUpdate} />
						) : (
							<ConnectSlackCard onConnect={handleConnect} />
						)}
					</section>
				) : null}
			</div>
		</div>
	);
}
