import { useEffect, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import {
	AlertIcon,
	CheckIcon,
	DatabaseIcon,
	DatadogIcon,
	GitHubIcon,
	HashIcon,
	LinkIcon,
	SlackIcon,
	SpinnerIcon,
} from "../../components/Icons";
import { useQueryClient } from "@tanstack/react-query";
import { useAppAuth } from "./context";
import { ErrorBanner, SettingRow, Toggle, inputClass, textareaClass, Modal, Select } from "./ui";
import type {
	AppUser,
	CompanySettings,
	DataSource,
	DatadogService,
	DatadogSettings,
	GitHubRepo,
	GitHubSettings,
	SlackChannel,
	SlackSettings,
} from "./types";
import { normalizeCompanySettings } from "./companySettings";
import { useT } from "./i18n";
import {
	CATALOG_CONNECTORS,
	CONNECTOR_CATEGORY_META,
	CONNECTOR_META,
	catalogConnectorsInCategory,
} from "./ConnectorPills";

type SettingsTab = "integrations" | "workspace";

const SETTINGS_TAB_IDS: SettingsTab[] = ["integrations", "workspace"];

function tabBlurb(tab: SettingsTab): string {
	switch (tab) {
		case "integrations":
			return "Connectors so Lumantic can answer from live product, code, and reliability data.";
		case "workspace":
			return "Rename the company, limit invite domains, or delete the workspace.";
	}
}

function parseTab(raw: string | null): SettingsTab {
	if (raw === "workspace") return "workspace";
	return "integrations";
}

function DeleteWorkspaceModal({
	companyName,
	onClose,
	onDeleted,
}: {
	companyName: string;
	onClose: () => void;
	onDeleted: () => void;
}) {
	const { request } = useAppAuth();
	const [confirmation, setConfirmation] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");
	const canDelete = confirmation.trim() === companyName;

	async function handleDelete(e: FormEvent) {
		e.preventDefault();
		if (!canDelete || deleting) return;
		setDeleting(true);
		setError("");
		try {
			await request<{ ok: boolean }>("/company/delete", {
				method: "POST",
				body: JSON.stringify({ confirmation: confirmation.trim() }),
			});
			onDeleted();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete workspace");
			setDeleting(false);
		}
	}

	return (
		<Modal title="Delete workspace?" onClose={onClose}>
			<form onSubmit={handleDelete} className="flex flex-col gap-4">
				<p className="text-sm leading-relaxed text-violet-200/80">
					This permanently removes the {companyName} workspace for everyone. Type{" "}
					<strong className="font-semibold text-violet-50">{companyName}</strong> to confirm.
				</p>
				<div>
					<label className="mb-1.5 block text-xs font-medium text-violet-300/70">Confirmation</label>
					<input
						value={confirmation}
						onChange={(e) => setConfirmation(e.target.value)}
						autoFocus
						autoComplete="off"
						spellCheck={false}
						placeholder={companyName}
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
						onClick={onClose}
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
						{deleting ? "Deleting…" : "Delete workspace"}
					</button>
				</div>
			</form>
		</Modal>
	);
}

const KIND_LABEL: Record<DataSource["kind"], string> = {
	warehouse: "Warehouse",
	database: "Remote DB",
	lakehouse: "Lakehouse",
};

const DATADOG_SITES = [
	{ id: "datadoghq.com", label: "US1 (datadoghq.com)" },
	{ id: "us3.datadoghq.com", label: "US3" },
	{ id: "us5.datadoghq.com", label: "US5" },
	{ id: "datadoghq.eu", label: "EU1" },
	{ id: "ap1.datadoghq.com", label: "AP1" },
] as const;

function ConnectCatalogCard({
	connectorId,
	connected,
	onConnect,
	onDisconnect,
}: {
	connectorId: (typeof CATALOG_CONNECTORS)[number];
	connected: boolean;
	onConnect: () => void;
	onDisconnect: () => void;
}) {
	const meta = CONNECTOR_META[connectorId];
	const [busy, setBusy] = useState(false);

	return (
		<div className="flex flex-col rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4">
			<div className="flex items-start gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
					{meta.icon("size-5")}
				</span>
				<div className="min-w-0 flex-1">
					<p className="flex flex-wrap items-center gap-2 font-medium text-violet-50">
						{meta.label}
						{connected && (
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
								<span className="size-1.5 rounded-full bg-emerald-400" />
								Connected
							</span>
						)}
					</p>
					<p className="mt-1 text-xs leading-relaxed text-violet-400/55">{meta.blurb}</p>
				</div>
			</div>
			{connected ? (
				<button
					type="button"
					onClick={async () => {
						setBusy(true);
						try {
							onDisconnect();
						} finally {
							setBusy(false);
						}
					}}
					disabled={busy}
					className="mt-4 w-full cursor-pointer rounded-lg border border-rose-500/25 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{busy ? "Disconnecting…" : "Disconnect"}
				</button>
			) : (
				<button
					type="button"
					onClick={async () => {
						setBusy(true);
						try {
							onConnect();
						} finally {
							setBusy(false);
						}
					}}
					disabled={busy}
					className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-violet-500/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/50 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{busy ? <SpinnerIcon className="size-3.5" /> : <LinkIcon className="size-3.5" />}
					{busy ? "Connecting…" : "Connect"}
				</button>
			)}
		</div>
	);
}

function ConnectorCategorySection({
	category,
	children,
}: {
	category: keyof typeof CONNECTOR_CATEGORY_META;
	children: ReactNode;
}) {
	const meta = CONNECTOR_CATEGORY_META[category];
	return (
		<section>
			<h2 className="mb-1 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">{meta.label}</h2>
			<p className="mb-3 text-sm text-violet-400/50">{meta.description}</p>
			<div className="space-y-3">{children}</div>
		</section>
	);
}

function CatalogGrid({
	category,
	catalogConnected,
	setCatalogConnected,
}: {
	category: keyof typeof CONNECTOR_CATEGORY_META;
	catalogConnected: Record<(typeof CATALOG_CONNECTORS)[number], boolean>;
	setCatalogConnected: Dispatch<SetStateAction<Record<(typeof CATALOG_CONNECTORS)[number], boolean>>>;
}) {
	const ids = catalogConnectorsInCategory(category) as (typeof CATALOG_CONNECTORS)[number][];
	if (ids.length === 0) return null;
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{ids.map((id) => (
				<ConnectCatalogCard
					key={id}
					connectorId={id}
					connected={catalogConnected[id]}
					onConnect={() => setCatalogConnected((prev) => ({ ...prev, [id]: true }))}
					onDisconnect={() => setCatalogConnected((prev) => ({ ...prev, [id]: false }))}
				/>
			))}
		</div>
	);
}

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
					<p className="mx-auto mt-1 max-w-sm text-sm text-violet-300/60">{CONNECTOR_META.slack.blurb}</p>
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
	onUpdate: (
		patch: Partial<{
			botName: string;
			defaultChannelId: string;
			postProposedMemories: boolean;
			postDailyDigest: boolean;
			notifyOnNewMemory: boolean;
		}>,
	) => Promise<void>;
}) {
	const [botName, setBotName] = useState(settings.botName);
	const [botNameSource, setBotNameSource] = useState(settings.botName);
	const [disconnecting, setDisconnecting] = useState(false);
	const [savingField, setSavingField] = useState<string | null>(null);

	if (settings.botName !== botNameSource) {
		setBotNameSource(settings.botName);
		setBotName(settings.botName);
	}

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
						<p className="text-xs text-violet-400/50">
							Updated{" "}
							{new Date(
								settings.updatedAt.endsWith("Z") ? settings.updatedAt : `${settings.updatedAt}Z`,
							).toLocaleString(undefined, {
								dateStyle: "medium",
								timeStyle: "short",
							})}
						</p>
						<p className="mt-1.5 max-w-md text-xs leading-relaxed text-violet-400/55">{CONNECTOR_META.slack.blurb}</p>
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
					<Select
						value={settings.defaultChannelId ?? ""}
						onChange={(e) => saveField("channel", { defaultChannelId: e.target.value })}
						disabled={savingField === "channel"}
						wrapperClassName="w-full"
						leading={<HashIcon className="size-3.5" />}
					>
						{channels.map((c) => (
							<option key={c.id} value={c.id} className="bg-ink">
								{c.name}
								{c.is_private ? " (private)" : ""}
							</option>
						))}
					</Select>
				</label>
			</div>

			<div className="mt-2 divide-y divide-violet-500/10">
				<SettingRow
					title="Post proposed memories for review"
					description="Send new proposed memories from Lumantic to the channel so the team can approve them from Slack too."
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

function ConnectGitHubCard({ onConnect }: { onConnect: () => Promise<void> }) {
	const [connecting, setConnecting] = useState(false);

	return (
		<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6">
			<div className="flex flex-col items-center gap-3 py-6 text-center">
				<span className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] text-violet-100">
					<GitHubIcon className="size-7" />
				</span>
				<div>
					<p className="font-medium text-violet-50">Connect your company's GitHub</p>
					<p className="mx-auto mt-1 max-w-sm text-sm text-violet-300/60">{CONNECTOR_META.github.blurb}</p>
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
					{connecting ? "Connecting…" : "Connect to GitHub"}
				</button>
			</div>
		</div>
	);
}

function ConnectedGitHubCard({
	settings,
	repos,
	onDisconnect,
	onUpdate,
}: {
	settings: GitHubSettings;
	repos: GitHubRepo[];
	onDisconnect: () => Promise<void>;
	onUpdate: (
		patch: Partial<{
			defaultRepoId: string;
			syncMetricDefs: boolean;
			commentOnAnalyticsPrs: boolean;
			watchSchemaChanges: boolean;
		}>,
	) => Promise<void>;
}) {
	const [disconnecting, setDisconnecting] = useState(false);
	const [savingField, setSavingField] = useState<string | null>(null);

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
					<span className="flex size-11 items-center justify-center rounded-xl bg-white/[0.04] text-violet-100">
						<GitHubIcon className="size-6" />
					</span>
					<div>
						<p className="flex flex-wrap items-center gap-2 font-medium text-violet-50">
							{settings.orgName}
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
								<span className="size-1.5 rounded-full bg-emerald-400" />
								Connected
							</span>
						</p>
						<p className="text-xs text-violet-400/50">
							@{settings.accountLogin} · Updated{" "}
							{new Date(
								settings.updatedAt.endsWith("Z") ? settings.updatedAt : `${settings.updatedAt}Z`,
							).toLocaleString(undefined, {
								dateStyle: "medium",
								timeStyle: "short",
							})}
						</p>
						<p className="mt-1.5 max-w-md text-xs leading-relaxed text-violet-400/55">{CONNECTOR_META.github.blurb}</p>
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

			<div className="mt-6">
				<label className="block">
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Default repository</span>
					<Select
						value={settings.defaultRepoId ?? ""}
						onChange={(e) => saveField("repo", { defaultRepoId: e.target.value })}
						disabled={savingField === "repo"}
						wrapperClassName="w-full"
						leading={<GitHubIcon className="size-3.5" />}
					>
						{repos.map((r) => (
							<option key={r.id} value={r.id} className="bg-ink">
								{r.full_name}
								{r.private ? " (private)" : ""}
							</option>
						))}
					</Select>
				</label>
			</div>

			<div className="mt-2 divide-y divide-violet-500/10">
				<SettingRow
					title="Sync metric definitions from PRs"
					description="When analytics PRs merge, propose memory updates for changed metric SQL and Looker definitions."
					control={
						<Toggle
							checked={settings.syncMetricDefs}
							disabled={savingField === "syncMetricDefs"}
							onChange={(checked) => saveField("syncMetricDefs", { syncMetricDefs: checked })}
						/>
					}
				/>
				<SettingRow
					title="Comment on analytics PRs"
					description="Leave a Lumantic review note when a PR touches metric definitions or warehouse models."
					control={
						<Toggle
							checked={settings.commentOnAnalyticsPrs}
							disabled={savingField === "commentOnAnalyticsPrs"}
							onChange={(checked) => saveField("commentOnAnalyticsPrs", { commentOnAnalyticsPrs: checked })}
						/>
					}
				/>
				<SettingRow
					title="Watch schema changes"
					description="Flag migrations that rename or drop columns used by confirmed memories."
					control={
						<Toggle
							checked={settings.watchSchemaChanges}
							disabled={savingField === "watchSchemaChanges"}
							onChange={(checked) => saveField("watchSchemaChanges", { watchSchemaChanges: checked })}
						/>
					}
				/>
			</div>
		</div>
	);
}

function ConnectDatadogCard({ onConnect }: { onConnect: () => Promise<void> }) {
	const [connecting, setConnecting] = useState(false);

	return (
		<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6">
			<div className="flex flex-col items-center gap-3 py-6 text-center">
				<span className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] text-violet-100">
					<DatadogIcon className="size-7" />
				</span>
				<div>
					<p className="font-medium text-violet-50">Connect Datadog</p>
					<p className="mx-auto mt-1 max-w-sm text-sm text-violet-300/60">{CONNECTOR_META.datadog.blurb}</p>
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
					{connecting ? "Connecting…" : "Connect to Datadog"}
				</button>
			</div>
		</div>
	);
}

function ConnectedDatadogCard({
	settings,
	services,
	onDisconnect,
	onUpdate,
}: {
	settings: DatadogSettings;
	services: DatadogService[];
	onDisconnect: () => Promise<void>;
	onUpdate: (
		patch: Partial<{
			site: string;
			defaultService: string;
			syncApmErrors: boolean;
			syncSloBreaches: boolean;
			useInChat: boolean;
		}>,
	) => Promise<void>;
}) {
	const [disconnecting, setDisconnecting] = useState(false);
	const [savingField, setSavingField] = useState<string | null>(null);

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
					<span className="flex size-11 items-center justify-center rounded-xl bg-white/[0.04] text-violet-100">
						<DatadogIcon className="size-6" />
					</span>
					<div>
						<p className="flex flex-wrap items-center gap-2 font-medium text-violet-50">
							{settings.orgName}
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
								<span className="size-1.5 rounded-full bg-emerald-400" />
								Connected
							</span>
						</p>
						<p className="text-xs text-violet-400/50">
							{settings.site} · Updated{" "}
							{new Date(
								settings.updatedAt.endsWith("Z") ? settings.updatedAt : `${settings.updatedAt}Z`,
							).toLocaleString(undefined, {
								dateStyle: "medium",
								timeStyle: "short",
							})}
						</p>
						<p className="mt-1.5 max-w-md text-xs leading-relaxed text-violet-400/55">{CONNECTOR_META.datadog.blurb}</p>
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
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Site</span>
					<Select
						value={settings.site}
						onChange={(e) => saveField("site", { site: e.target.value })}
						disabled={savingField === "site"}
						wrapperClassName="w-full"
					>
						{DATADOG_SITES.map((s) => (
							<option key={s.id} value={s.id} className="bg-ink">
								{s.label}
							</option>
						))}
					</Select>
				</label>
				<label className="block">
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Default service</span>
					<Select
						value={settings.defaultService ?? ""}
						onChange={(e) => saveField("service", { defaultService: e.target.value })}
						disabled={savingField === "service"}
						wrapperClassName="w-full"
						leading={<DatadogIcon className="size-3.5" />}
					>
						{services.map((s) => (
							<option key={s.id} value={s.name} className="bg-ink">
								{s.name} ({s.env})
							</option>
						))}
					</Select>
				</label>
			</div>

			<div className="mt-2 divide-y divide-violet-500/10">
				<SettingRow
					title="Sync APM errors"
					description="Surface error spikes from your default service when they may explain product metric dips."
					control={
						<Toggle
							checked={settings.syncApmErrors}
							disabled={savingField === "syncApmErrors"}
							onChange={(checked) => saveField("syncApmErrors", { syncApmErrors: checked })}
						/>
					}
				/>
				<SettingRow
					title="Sync SLO breaches"
					description="Propose memories when SLOs for product-critical services burn or breach."
					control={
						<Toggle
							checked={settings.syncSloBreaches}
							disabled={savingField === "syncSloBreaches"}
							onChange={(checked) => saveField("syncSloBreaches", { syncSloBreaches: checked })}
						/>
					}
				/>
				<SettingRow
					title="Use in chat answers"
					description="Let Lumantic cite Datadog context when answering reliability-related questions."
					control={
						<Toggle
							checked={settings.useInChat}
							disabled={savingField === "useInChat"}
							onChange={(checked) => saveField("useInChat", { useInChat: checked })}
						/>
					}
				/>
			</div>
		</div>
	);
}

function AvailableSourceCard({ source, onConnect }: { source: DataSource; onConnect: () => Promise<void> }) {
	const [connecting, setConnecting] = useState(false);
	const warehouseBlurb = source.kind === "warehouse" ? CONNECTOR_META.warehouse.blurb : null;

	return (
		<div className="flex flex-col rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4">
			<div className="flex items-start gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-violet-200">
					<DatabaseIcon className="size-5" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="font-medium text-violet-50">{source.label}</p>
					<p className="text-xs text-violet-400/50">{KIND_LABEL[source.kind]}</p>
					{warehouseBlurb ? (
						<p className="mt-1.5 text-xs leading-relaxed text-violet-400/55">{warehouseBlurb}</p>
					) : (
						<p className="mt-1.5 text-xs leading-relaxed text-violet-400/55">
							Connect this {KIND_LABEL[source.kind].toLowerCase()} so Lumantic can query it for product and business
							answers.
						</p>
					)}
				</div>
			</div>
			<button
				type="button"
				onClick={async () => {
					setConnecting(true);
					try {
						await onConnect();
					} finally {
						setConnecting(false);
					}
				}}
				disabled={connecting}
				className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-violet-500/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/50 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
			>
				{connecting ? <SpinnerIcon className="size-3.5" /> : <LinkIcon className="size-3.5" />}
				{connecting ? "Connecting…" : "Connect"}
			</button>
		</div>
	);
}

function ConnectedSourceCard({
	source,
	onDisconnect,
	onUpdate,
}: {
	source: DataSource;
	onDisconnect: () => Promise<void>;
	onUpdate: (
		patch: Partial<{
			displayName: string;
			databaseName: string;
			schemaName: string;
			readOnly: boolean;
			useForChat: boolean;
		}>,
	) => Promise<void>;
}) {
	const [disconnecting, setDisconnecting] = useState(false);
	const [savingField, setSavingField] = useState<string | null>(null);
	const [displayName, setDisplayName] = useState(source.displayName ?? source.label);
	const [databaseName, setDatabaseName] = useState(source.databaseName ?? "");
	const [schemaName, setSchemaName] = useState(source.schemaName ?? "");
	const sourceFieldsKey = `${source.displayName ?? ""}\0${source.label}\0${source.databaseName ?? ""}\0${source.schemaName ?? ""}`;
	const [sourceFieldsSource, setSourceFieldsSource] = useState(sourceFieldsKey);

	if (sourceFieldsKey !== sourceFieldsSource) {
		setSourceFieldsSource(sourceFieldsKey);
		setDisplayName(source.displayName ?? source.label);
		setDatabaseName(source.databaseName ?? "");
		setSchemaName(source.schemaName ?? "");
	}

	async function saveField(key: string, patch: Parameters<typeof onUpdate>[0]) {
		setSavingField(key);
		try {
			await onUpdate(patch);
		} finally {
			setSavingField(null);
		}
	}

	return (
		<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-violet-200">
						<DatabaseIcon className="size-5" />
					</span>
					<div className="min-w-0">
						<p className="flex flex-wrap items-center gap-2 font-medium text-violet-50">
							<span className="truncate">{source.displayName ?? source.label}</span>
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
								<span className="size-1.5 rounded-full bg-emerald-400" />
								Connected
							</span>
						</p>
						<p className="truncate text-xs text-violet-400/50">
							{source.label} · {KIND_LABEL[source.kind]}
							{source.host ? ` · ${source.host}` : ""}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={async () => {
						setDisconnecting(true);
						try {
							await onDisconnect();
						} finally {
							setDisconnecting(false);
						}
					}}
					disabled={disconnecting}
					className="rounded-lg border border-rose-500/25 px-3 py-1.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
				>
					{disconnecting ? "Disconnecting…" : "Disconnect"}
				</button>
			</div>

			<div className="mt-5 grid gap-3 sm:grid-cols-3">
				<label className="block sm:col-span-1">
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Display name</span>
					<div className="flex gap-2">
						<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
						<button
							type="button"
							onClick={() => saveField("displayName", { displayName })}
							disabled={
								savingField === "displayName" ||
								!displayName.trim() ||
								displayName === (source.displayName ?? source.label)
							}
							className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-500/20 px-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/40 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{savingField === "displayName" ? (
								<SpinnerIcon className="size-3.5" />
							) : (
								<CheckIcon className="size-3.5" />
							)}
						</button>
					</div>
				</label>
				<label className="block">
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Database</span>
					<div className="flex gap-2">
						<input value={databaseName} onChange={(e) => setDatabaseName(e.target.value)} className={inputClass} />
						<button
							type="button"
							onClick={() => saveField("databaseName", { databaseName })}
							disabled={
								savingField === "databaseName" || !databaseName.trim() || databaseName === (source.databaseName ?? "")
							}
							className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-500/20 px-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/40 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{savingField === "databaseName" ? (
								<SpinnerIcon className="size-3.5" />
							) : (
								<CheckIcon className="size-3.5" />
							)}
						</button>
					</div>
				</label>
				<label className="block">
					<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Schema</span>
					<div className="flex gap-2">
						<input value={schemaName} onChange={(e) => setSchemaName(e.target.value)} className={inputClass} />
						<button
							type="button"
							onClick={() => saveField("schemaName", { schemaName })}
							disabled={savingField === "schemaName" || !schemaName.trim() || schemaName === (source.schemaName ?? "")}
							className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-500/20 px-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/40 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{savingField === "schemaName" ? <SpinnerIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
						</button>
					</div>
				</label>
			</div>

			<div className="mt-2 divide-y divide-violet-500/10">
				<SettingRow
					title="Read-only queries"
					description="Lumantic only runs SELECT-style queries against this source. Writes stay blocked."
					control={
						<Toggle
							checked={source.readOnly}
							disabled={savingField === "readOnly"}
							onChange={(checked) => saveField("readOnly", { readOnly: checked })}
						/>
					}
				/>
				<SettingRow
					title="Use in chat answers"
					description="Let Lumantic query this source when answering product analytics questions."
					control={
						<Toggle
							checked={source.useForChat}
							disabled={savingField === "useForChat"}
							onChange={(checked) => saveField("useForChat", { useForChat: checked })}
						/>
					}
				/>
			</div>
		</div>
	);
}

export function SettingsPage() {
	const { user, request, applyUser, logout } = useAppAuth();
	const t = useT();
	const queryClient = useQueryClient();
	const [slack, setSlack] = useState<SlackSettings | null>(null);
	const [channels, setChannels] = useState<SlackChannel[]>([]);
	const [github, setGitHub] = useState<GitHubSettings | null>(null);
	const [repos, setRepos] = useState<GitHubRepo[]>([]);
	const [datadog, setDatadog] = useState<DatadogSettings | null>(null);
	const [datadogServices, setDatadogServices] = useState<DatadogService[]>([]);
	const [sources, setSources] = useState<DataSource[]>([]);
	const [company, setCompany] = useState<CompanySettings | null>(null);
	const [savingField, setSavingField] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
	const [companyNameDraft, setCompanyNameDraft] = useState("");
	const [domainsDraft, setDomainsDraft] = useState("");
	const [tab, setTab] = useState<SettingsTab>(() => parseTab(new URLSearchParams(window.location.search).get("tab")));
	const [catalogConnected, setCatalogConnected] = useState<Record<(typeof CATALOG_CONNECTORS)[number], boolean>>({
		gitlab: false,
		sentry: true,
		segment: true,
		mixpanel: true,
		incident_io: true,
		launchdarkly: true,
	});

	const isOwner = user?.workspaceRole === "Owner";

	function load() {
		return Promise.all([
			request<{ settings: SlackSettings; channels: SlackChannel[] }>("/slack"),
			request<{ settings: GitHubSettings; repos: GitHubRepo[] }>("/github"),
			request<{ settings: DatadogSettings; services: DatadogService[] }>("/datadog"),
			request<{ sources: DataSource[] }>("/data-sources"),
			request<{ company: CompanySettings }>("/company"),
		]).then(([slackData, githubData, datadogData, sourcesData, companyData]) => {
			setSlack(slackData.settings);
			setChannels(slackData.channels);
			setGitHub(githubData.settings);
			setRepos(githubData.repos);
			setDatadog(datadogData.settings);
			setDatadogServices(datadogData.services);
			setSources(sourcesData.sources);
			const next = normalizeCompanySettings(companyData.company);
			setCompany(next);
			setCompanyNameDraft(next.companyName);
			setDomainsDraft(next.inviteEmailDomains.join("\n"));
		});
	}

	useEffect(() => {
		load()
			.catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"))
			.finally(() => setLoading(false));
	}, []);

	function switchTab(next: SettingsTab) {
		setTab(next);
		const url = new URL(window.location.href);
		if (next === "integrations") url.searchParams.delete("tab");
		else url.searchParams.set("tab", next);
		window.history.replaceState({}, "", `${url.pathname}${url.search}`);
	}

	async function patchCompany(patch: Partial<CompanySettings>, field: string) {
		setSavingField(field);
		setError("");
		try {
			const data = await request<{ company: CompanySettings; user?: AppUser }>("/company", {
				method: "PUT",
				body: JSON.stringify(patch),
			});
			const next = normalizeCompanySettings(data.company);
			setCompany(next);
			if (patch.companyName !== undefined) setCompanyNameDraft(next.companyName);
			if (patch.inviteEmailDomains !== undefined) setDomainsDraft(next.inviteEmailDomains.join("\n"));
			if (data.user) applyUser(data.user);
			await queryClient.invalidateQueries({ queryKey: ["company-settings"] });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update preferences");
		} finally {
			setSavingField(null);
		}
	}

	async function handleSaveCompanyName() {
		const next = companyNameDraft.trim();
		if (!next || next === company?.companyName) return;
		await patchCompany({ companyName: next }, "companyName");
	}

	async function handleSaveDomains() {
		const domains = domainsDraft
			.split(/[\n,]+/)
			.map((d) => d.trim())
			.filter(Boolean);
		await patchCompany({ inviteEmailDomains: domains }, "inviteEmailDomains");
	}

	async function handleSlackConnect() {
		const data = await request<{ settings: SlackSettings }>("/slack/connect", {
			method: "POST",
			body: JSON.stringify({}),
		});
		setSlack(data.settings);
		const chans = await request<{ settings: SlackSettings; channels: SlackChannel[] }>("/slack");
		setChannels(chans.channels);
	}

	async function handleSlackDisconnect() {
		const data = await request<{ settings: SlackSettings }>("/slack/disconnect", { method: "POST" });
		setSlack(data.settings);
	}

	async function handleSlackUpdate(patch: Record<string, unknown>) {
		const data = await request<{ settings: SlackSettings }>("/slack", { method: "PUT", body: JSON.stringify(patch) });
		setSlack(data.settings);
	}

	async function handleGitHubConnect() {
		const data = await request<{ settings: GitHubSettings }>("/github/connect", {
			method: "POST",
			body: JSON.stringify({}),
		});
		setGitHub(data.settings);
		const fresh = await request<{ settings: GitHubSettings; repos: GitHubRepo[] }>("/github");
		setRepos(fresh.repos);
	}

	async function handleGitHubDisconnect() {
		const data = await request<{ settings: GitHubSettings }>("/github/disconnect", { method: "POST" });
		setGitHub(data.settings);
	}

	async function handleGitHubUpdate(patch: Record<string, unknown>) {
		const data = await request<{ settings: GitHubSettings }>("/github", { method: "PUT", body: JSON.stringify(patch) });
		setGitHub(data.settings);
	}

	async function handleDatadogConnect() {
		const data = await request<{ settings: DatadogSettings }>("/datadog/connect", {
			method: "POST",
			body: JSON.stringify({}),
		});
		setDatadog(data.settings);
		const fresh = await request<{ settings: DatadogSettings; services: DatadogService[] }>("/datadog");
		setDatadogServices(fresh.services);
	}

	async function handleDatadogDisconnect() {
		const data = await request<{ settings: DatadogSettings }>("/datadog/disconnect", { method: "POST" });
		setDatadog(data.settings);
	}

	async function handleDatadogUpdate(patch: Record<string, unknown>) {
		const data = await request<{ settings: DatadogSettings }>("/datadog", {
			method: "PUT",
			body: JSON.stringify(patch),
		});
		setDatadog(data.settings);
	}

	function upsertSource(next: DataSource) {
		setSources((prev) => {
			const without = prev.filter((s) => s.id !== next.id);
			return [...without, next].sort(
				(a, b) => Number(b.connected) - Number(a.connected) || a.label.localeCompare(b.label),
			);
		});
	}

	async function handleSourceConnect(id: string) {
		const data = await request<{ source: DataSource }>(`/data-sources/${id}/connect`, {
			method: "POST",
			body: JSON.stringify({}),
		});
		if (data.source) upsertSource(data.source);
	}

	async function handleSourceDisconnect(id: string) {
		const data = await request<{ source: DataSource }>(`/data-sources/${id}/disconnect`, { method: "POST" });
		if (data.source) upsertSource(data.source);
	}

	async function handleSourceUpdate(id: string, patch: Record<string, unknown>) {
		const data = await request<{ source: DataSource }>(`/data-sources/${id}`, {
			method: "PUT",
			body: JSON.stringify(patch),
		});
		if (data.source) upsertSource(data.source);
	}

	const connectedSources = sources.filter((s) => s.connected);
	const availableSources = sources.filter((s) => !s.connected);

	return (
		<div className="h-full overflow-y-auto">
			<div className="border-b border-violet-500/10 px-6 py-5">
				<div>
					<h1 className="font-display text-xl font-semibold text-violet-50">{t("settings.title")}</h1>
					<p className="mt-1 text-sm text-violet-300/60">{tabBlurb(tab)}</p>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-3">
					<div className="grid grid-cols-2 gap-1 rounded-xl border border-violet-500/15 bg-white/[0.02] p-1 text-xs font-medium">
						{SETTINGS_TAB_IDS.map((id) => (
							<button
								key={id}
								type="button"
								onClick={() => switchTab(id)}
								className={`cursor-pointer rounded-lg px-3 py-2 transition ${
									tab === id
										? "bg-violet-500/20 text-violet-50"
										: "text-violet-300/60 hover:text-violet-100"
								}`}
							>
								{t(id === "integrations" ? "settings.tab.integrations" : "settings.tab.workspace")}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
				{error && <ErrorBanner message={error} />}

				{showDeleteWorkspace && company && (
					<DeleteWorkspaceModal
						companyName={company.companyName}
						onClose={() => setShowDeleteWorkspace(false)}
						onDeleted={() => {
							setShowDeleteWorkspace(false);
							logout();
						}}
					/>
				)}

				{loading ? (
					<div className="flex justify-center py-16">
						<SpinnerIcon className="size-5 text-violet-400" />
					</div>
				) : tab === "workspace" ? (
					company && (
						<>
							<section>
								<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
									Company
								</h2>
								<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
									<label className="mb-1.5 block text-sm font-medium text-violet-100">Company name</label>
									<p className="mb-3 text-xs text-violet-300/50">
										Shown in the sidebar, invites, and billing for this workspace.
									</p>
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
										<input
											value={companyNameDraft}
											onChange={(e) => setCompanyNameDraft(e.target.value)}
											aria-label="Company name"
											className={inputClass}
										/>
										<button
											type="button"
											disabled={
												savingField === "companyName" ||
												!companyNameDraft.trim() ||
												companyNameDraft.trim() === company.companyName
											}
											onClick={() => void handleSaveCompanyName()}
											className="shrink-0 rounded-lg bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
										>
											{savingField === "companyName" ? "Saving…" : "Save"}
										</button>
									</div>
								</div>
							</section>

							<section>
								<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
									Invites
								</h2>
								<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
									<label className="mb-1.5 block text-sm font-medium text-violet-100">
										Allowed email domains
									</label>
									<p className="mb-3 text-xs text-violet-300/50">
										Only people with these domains can be invited. Leave empty to allow any domain. One
										domain per line.
									</p>
									<textarea
										value={domainsDraft}
										onChange={(e) => setDomainsDraft(e.target.value)}
										aria-label="Allowed email domains"
										placeholder={"acme.com\nacme.co.uk"}
										className={textareaClass}
									/>
									<div className="mt-3 flex justify-end">
										<button
											type="button"
											disabled={savingField === "inviteEmailDomains"}
											onClick={() => void handleSaveDomains()}
											className="rounded-lg bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
										>
											{savingField === "inviteEmailDomains" ? "Saving…" : "Save domains"}
										</button>
									</div>
								</div>
							</section>

							<section>
								<h2 className="mb-3 text-sm font-semibold tracking-wide text-rose-300/70 uppercase">
									Danger zone
								</h2>
								<div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
									<p className="text-sm font-medium text-violet-50">Delete workspace</p>
									<p className="mt-1 text-xs text-violet-300/50">
										{isOwner
											? "Permanently remove this workspace and sign everyone out. This cannot be undone."
											: "Only the workspace owner can delete the workspace."}
									</p>
									<button
										type="button"
										disabled={!isOwner}
										onClick={() => setShowDeleteWorkspace(true)}
										className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50"
									>
										Delete workspace
									</button>
								</div>
							</section>
						</>
					)
				) : (
					<>
						{slack && (
							<ConnectorCategorySection category="collaboration">
								{slack.connected ? (
									<ConnectedSlackCard
										settings={slack}
										channels={channels}
										onDisconnect={handleSlackDisconnect}
										onUpdate={handleSlackUpdate}
									/>
								) : (
									<ConnectSlackCard onConnect={handleSlackConnect} />
								)}
							</ConnectorCategorySection>
						)}

						{(github || catalogConnectorsInCategory("code").length > 0) && (
							<ConnectorCategorySection category="code">
								{github &&
									(github.connected ? (
										<ConnectedGitHubCard
											settings={github}
											repos={repos}
											onDisconnect={handleGitHubDisconnect}
											onUpdate={handleGitHubUpdate}
										/>
									) : (
										<ConnectGitHubCard onConnect={handleGitHubConnect} />
									))}
								<CatalogGrid
									category="code"
									catalogConnected={catalogConnected}
									setCatalogConnected={setCatalogConnected}
								/>
							</ConnectorCategorySection>
						)}

						{(datadog || catalogConnectorsInCategory("data").length > 0) && (
							<ConnectorCategorySection category="data">
								{datadog &&
									(datadog.connected ? (
										<ConnectedDatadogCard
											settings={datadog}
											services={datadogServices}
											onDisconnect={handleDatadogDisconnect}
											onUpdate={handleDatadogUpdate}
										/>
									) : (
										<ConnectDatadogCard onConnect={handleDatadogConnect} />
									))}
								<CatalogGrid
									category="data"
									catalogConnected={catalogConnected}
									setCatalogConnected={setCatalogConnected}
								/>
							</ConnectorCategorySection>
						)}

						{catalogConnectorsInCategory("events").length > 0 && (
							<ConnectorCategorySection category="events">
								<CatalogGrid
									category="events"
									catalogConnected={catalogConnected}
									setCatalogConnected={setCatalogConnected}
								/>
							</ConnectorCategorySection>
						)}

						{catalogConnectorsInCategory("flags").length > 0 && (
							<ConnectorCategorySection category="flags">
								<CatalogGrid
									category="flags"
									catalogConnected={catalogConnected}
									setCatalogConnected={setCatalogConnected}
								/>
							</ConnectorCategorySection>
						)}

						{catalogConnectorsInCategory("incidents").length > 0 && (
							<ConnectorCategorySection category="incidents">
								<CatalogGrid
									category="incidents"
									catalogConnected={catalogConnected}
									setCatalogConnected={setCatalogConnected}
								/>
							</ConnectorCategorySection>
						)}

						<ConnectorCategorySection category="warehouse">
							{connectedSources.length > 0 && (
								<div className="space-y-3">
									{connectedSources.map((source) => (
										<ConnectedSourceCard
											key={source.id}
											source={source}
											onDisconnect={() => handleSourceDisconnect(source.id)}
											onUpdate={(patch) => handleSourceUpdate(source.id, patch)}
										/>
									))}
								</div>
							)}

							{availableSources.length > 0 && (
								<div className="grid gap-3 sm:grid-cols-2">
									{availableSources.map((source) => (
										<AvailableSourceCard
											key={source.id}
											source={source}
											onConnect={() => handleSourceConnect(source.id)}
										/>
									))}
								</div>
							)}
						</ConnectorCategorySection>
					</>
				)}
			</div>
		</div>
	);
}
