export type AppUser = {
	username: string;
	name: string;
	role: string;
	company: string;
	avatarUrl?: string | null;
	/** Connected Slack handle without @. Null until Slack sign-in or Connect Slack. */
	slackUsername?: string | null;
	/** Workspace access role from team_members (Owner / Admin / Member). */
	workspaceRole: "Owner" | "Admin" | "Member";
};

export type SlackChannel = {
	id: string;
	name: string;
	is_private: number;
};

export type SlackSettings = {
	connected: boolean;
	workspaceName: string | null;
	botName: string;
	defaultChannelId: string | null;
	defaultChannelName: string | null;
	postProposedMemories: boolean;
	postDailyDigest: boolean;
	notifyOnNewMemory: boolean;
	updatedAt: string;
};

export type GitHubRepo = {
	id: string;
	name: string;
	full_name: string;
	private: number;
};

export type GitHubSettings = {
	connected: boolean;
	orgName: string | null;
	accountLogin: string | null;
	defaultRepoId: string | null;
	defaultRepoName: string | null;
	syncMetricDefs: boolean;
	commentOnAnalyticsPrs: boolean;
	watchSchemaChanges: boolean;
	updatedAt: string;
};

export type DatadogService = {
	id: string;
	name: string;
	env: string;
};

export type DatadogSettings = {
	connected: boolean;
	orgName: string | null;
	site: string;
	defaultService: string | null;
	syncApmErrors: boolean;
	syncSloBreaches: boolean;
	useInChat: boolean;
	updatedAt: string;
};

export type DataSourceKind = "warehouse" | "database" | "lakehouse";

export type DataSource = {
	id: string;
	label: string;
	kind: DataSourceKind;
	connected: boolean;
	displayName: string | null;
	host: string | null;
	databaseName: string | null;
	schemaName: string | null;
	readOnly: boolean;
	useForChat: boolean;
	updatedAt: string;
};

export type Memory = {
	id: number;
	content: string;
	category: string;
	source: string;
	added_by?: string | null;
	created_at: string;
	updated_at: string;
};

export type ProposedMemory = {
	id: number;
	content: string;
	category: string;
	source: string;
	confidence: number;
	created_at: string;
};

export type Conversation = {
	id: number;
	title: string;
	scope?: "personal" | "global";
	author_name?: string | null;
	author_slack_username?: string | null;
	source_kind?: "app" | "slack" | string | null;
	source_channel?: string | null;
	pinned?: number;
	archived?: number;
	unread?: number;
	last_read_at?: string | null;
	created_at: string;
	updated_at: string;
};

export type ChatMessage = {
	id: number;
	role: "user" | "assistant";
	content: string;
	suggested_memory: string | null;
	artifact?: string | null;
	working?: string | null;
	confidence?: number | null;
	input_tokens?: number | null;
	output_tokens?: number | null;
	cost_usd?: number | null;
	/** Wall time to produce the assistant reply, in milliseconds. */
	latency_ms?: number | null;
	created_at: string;
};

export type CompanySettings = {
	displayCurrency: string;
	/** `auto` follows the browser; otherwise `12h` or `24h`. */
	timeFormat: "auto" | "12h" | "24h";
	/** `auto` follows the browser; otherwise an IANA timezone id. */
	timezone: string;
	/** Workspace display name (same as profile company for the demo). */
	companyName: string;
	/** Allowed email domains for invites (lowercase, no @). Empty = any domain. */
	inviteEmailDomains: string[];
	emailProposedMemories: boolean;
	emailDailyDigest: boolean;
	emailTeamInvites: boolean;
	emailBilling: boolean;
};

export const MEMORY_CATEGORIES = ["general", "definition", "gotcha", "business-rule", "insight"] as const;
