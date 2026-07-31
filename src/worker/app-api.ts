import { Hono } from "hono";
import type { Context } from "hono";
import {
	genericWorking,
	matchBeaconAnalyticsQuestion,
	memoryLookupWorking,
	type ChatWorking,
} from "../shared/beacon-analytics";
import { DEFAULT_DISPLAY_CURRENCY, isDisplayCurrency } from "../shared/currency";
import {
	DEFAULT_COMPANY_DATETIME,
	isTimeFormatPreference,
	isTimezonePreference,
	type TimeFormatPreference,
} from "../shared/datetime";
import { estimateReplyUsage } from "../shared/usage";
import { canAccessSettings, isWorkspaceRole, type WorkspaceRole } from "../shared/access";
import { clampLimit, clampPage, clampPageSize } from "../shared/pagination";
/**
 * API for the /app product experience: a fake (demo-only) login, Slack
 * integration settings, memories + proposed memories, and a simulated
 * chat with Lumantic. None of this talks to a real LLM or a
 * real Slack workspace — it's wired up so the product feels real end to end.
 */
const api = new Hono<{ Bindings: Env }>();

const DEMO_USERNAME = "test@example.com";
const DEMO_PASSWORD = "3F*PVVkB8dkIImwipIBVp0Z$";
const DEMO_USER: {
	username: string;
	name: string;
	role: string;
	company: string;
	avatarUrl: string | null;
	slackUsername: string | null;
	workspaceRole: WorkspaceRole;
} = {
	username: "test@example.com",
	name: "Avery Chen",
	role: "Head of Data",
	company: "Beacon",
	avatarUrl: null,
	slackUsername: null,
	workspaceRole: "Owner",
};

function demoSlackUsername(name: string): string {
	const first = name
		.trim()
		.split(/\s+/)[0]
		?.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
	return first || "avery";
}

// Demo-only signing secret for session tokens. This gate exists purely to
// simulate a real login flow — it is not meant to protect real data.
const SESSION_SECRET = "lumantic-app-demo-secret-v1";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_CHARS = 400_000;
const AVATAR_DATA_URL_RE = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

// Generic English words that are too common to be useful signals when
// matching a chat message against the memory bank below.
const GENERIC_WORDS = new Set([
	"the",
	"and",
	"for",
	"are",
	"but",
	"not",
	"you",
	"your",
	"with",
	"have",
	"has",
	"had",
	"this",
	"that",
	"these",
	"those",
	"what",
	"when",
	"where",
	"which",
	"while",
	"who",
	"will",
	"would",
	"could",
	"should",
	"about",
	"above",
	"after",
	"again",
	"all",
	"also",
	"always",
	"any",
	"because",
	"been",
	"before",
	"being",
	"between",
	"both",
	"can",
	"did",
	"does",
	"doing",
	"down",
	"during",
	"each",
	"few",
	"from",
	"further",
	"how",
	"into",
	"its",
	"itself",
	"just",
	"like",
	"more",
	"most",
	"need",
	"now",
	"off",
	"once",
	"only",
	"other",
	"our",
	"ours",
	"out",
	"over",
	"own",
	"really",
	"right",
	"same",
	"some",
	"such",
	"tell",
	"than",
	"then",
	"there",
	"they",
	"them",
	"through",
	"too",
	"under",
	"until",
	"very",
	"was",
	"way",
	"well",
	"were",
	"yes",
	"report",
	"reports",
]);

function tokenize(text: string): string[] {
	return (text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((word) => !GENERIC_WORDS.has(word));
}

// Deliberately exact-match only (no stemming/pluralization): fuzzy matching
// on short business terms like "count" vs "counts" produces confusing
// false positives against unrelated memories.
function wordsMatch(a: string, b: string): boolean {
	return a === b;
}

function timingSafeEqual(a: string, b: string): boolean {
	const enc = new TextEncoder();
	const aBytes = enc.encode(a);
	const bBytes = enc.encode(b);
	if (aBytes.length !== bBytes.length) return false;
	let result = 0;
	for (let i = 0; i < aBytes.length; i++) result |= aBytes[i] ^ bBytes[i];
	return result === 0;
}

function toBase64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
	const padded = value
		.replaceAll("-", "+")
		.replaceAll("_", "/")
		.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
	const binary = atob(padded);
	return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(SESSION_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

async function createSessionToken(username: string): Promise<string> {
	const payload = JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS });
	const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
	const key = await hmacKey();
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
	return `${payloadB64}.${toBase64Url(new Uint8Array(signature))}`;
}

async function verifySessionToken(token: string): Promise<{ username: string } | null> {
	const [payloadB64, sigB64] = token.split(".");
	if (!payloadB64 || !sigB64) return null;
	try {
		const key = await hmacKey();
		const valid = await crypto.subtle.verify(
			"HMAC",
			key,
			fromBase64Url(sigB64) as BufferSource,
			new TextEncoder().encode(payloadB64),
		);
		if (!valid) return null;
		const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as { u: string; exp: number };
		if (!payload.u || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
		return { username: payload.u };
	} catch {
		return null;
	}
}

async function requireAppAuth(c: Context<{ Bindings: Env }>): Promise<{ username: string } | null> {
	const header = c.req.header("authorization") ?? "";
	const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
	if (!token) return null;
	return verifySessionToken(token);
}

type ProfileRow = {
	name: string;
	role: string;
	company: string;
	avatar: string | null;
	slack_username: string | null;
};

async function getWorkspaceRole(env: Env): Promise<WorkspaceRole> {
	try {
		const row = await env.DB.prepare("SELECT role FROM team_members WHERE is_you = 1 LIMIT 1").first<{
			role: string;
		}>();
		if (row?.role && isWorkspaceRole(row.role)) return row.role;
	} catch (err) {
		console.error("getWorkspaceRole failed, falling back to Owner", err);
	}
	return "Owner";
}

async function getProfileUser(env: Env): Promise<typeof DEMO_USER> {
	try {
		const row = await env.DB.prepare(
			"SELECT name, role, company, avatar, slack_username FROM user_profile WHERE id = 1",
		).first<ProfileRow>();
		const workspaceRole = await getWorkspaceRole(env);
		if (!row) return { ...DEMO_USER, workspaceRole };
		return {
			username: DEMO_USERNAME,
			name: row.name,
			role: row.role,
			company: row.company,
			avatarUrl: row.avatar || null,
			slackUsername: row.slack_username || null,
			workspaceRole,
		};
	} catch (err) {
		// Local miniflare can briefly lose the D1 handle after migrations or a
		// stale long-lived vite process; never fail login because of that.
		console.error("getProfileUser failed, falling back to demo user", err);
		return DEMO_USER;
	}
}

async function requireWorkspaceAdmin(c: Context<{ Bindings: Env }>) {
	const session = await requireAppAuth(c);
	if (!session) return { error: c.json({ error: "Unauthorized" }, 401) as Response };
	const role = await getWorkspaceRole(c.env);
	if (!canAccessSettings(role)) {
		return { error: c.json({ error: "Only workspace admins can change settings." }, 403) as Response };
	}
	return { session, role };
}

async function getCompanySettings(env: Env): Promise<{
	displayCurrency: string;
	timeFormat: TimeFormatPreference;
	timezone: string;
	companyName: string;
	inviteEmailDomains: string[];
	emailProposedMemories: boolean;
	emailDailyDigest: boolean;
	emailTeamInvites: boolean;
	emailBilling: boolean;
}> {
	let companyName = DEMO_USER.company;
	try {
		const profile = await env.DB.prepare("SELECT company FROM user_profile WHERE id = 1").first<{ company: string }>();
		if (profile?.company?.trim()) companyName = profile.company.trim();
	} catch (err) {
		console.error("getCompanySettings profile lookup failed", err);
	}

	try {
		const row = await env.DB.prepare(
			`SELECT display_currency, time_format, timezone,
			        invite_email_domains,
			        email_proposed_memories, email_daily_digest, email_team_invites, email_billing
			 FROM company_settings WHERE id = 1`,
		).first<{
			display_currency: string;
			time_format: string | null;
			timezone: string | null;
			invite_email_domains: string | null;
			email_proposed_memories: number | null;
			email_daily_digest: number | null;
			email_team_invites: number | null;
			email_billing: number | null;
		}>();
		const code = row?.display_currency?.toUpperCase() ?? DEFAULT_DISPLAY_CURRENCY;
		const timeFormatRaw = row?.time_format ?? DEFAULT_COMPANY_DATETIME.timeFormat;
		const timezoneRaw = row?.timezone ?? DEFAULT_COMPANY_DATETIME.timezone;
		return {
			displayCurrency: isDisplayCurrency(code) ? code : DEFAULT_DISPLAY_CURRENCY,
			timeFormat: isTimeFormatPreference(timeFormatRaw) ? timeFormatRaw : DEFAULT_COMPANY_DATETIME.timeFormat,
			timezone: isTimezonePreference(timezoneRaw) ? timezoneRaw : DEFAULT_COMPANY_DATETIME.timezone,
			companyName,
			inviteEmailDomains: parseInviteEmailDomains(row?.invite_email_domains),
			emailProposedMemories: row?.email_proposed_memories == null ? true : Boolean(row.email_proposed_memories),
			emailDailyDigest: Boolean(row?.email_daily_digest),
			emailTeamInvites: row?.email_team_invites == null ? true : Boolean(row.email_team_invites),
			emailBilling: row?.email_billing == null ? true : Boolean(row.email_billing),
		};
	} catch (err) {
		console.error("getCompanySettings failed, falling back to defaults", err);
		return {
			displayCurrency: DEFAULT_DISPLAY_CURRENCY,
			timeFormat: DEFAULT_COMPANY_DATETIME.timeFormat,
			timezone: DEFAULT_COMPANY_DATETIME.timezone,
			companyName,
			inviteEmailDomains: [],
			emailProposedMemories: true,
			emailDailyDigest: false,
			emailTeamInvites: true,
			emailBilling: true,
		};
	}
}

function parseInviteEmailDomains(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return normalizeInviteEmailDomains(parsed.filter((d): d is string => typeof d === "string"));
	} catch {
		return [];
	}
}

function normalizeInviteEmailDomains(domains: string[]): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	for (const raw of domains) {
		const domain = raw
			.trim()
			.toLowerCase()
			.replace(/^@+/, "")
			.replace(/\/+$/, "");
		if (!domain || domain.length > 253) continue;
		if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) continue;
		if (seen.has(domain)) continue;
		seen.add(domain);
		out.push(domain);
		if (out.length >= 50) break;
	}
	return out;
}

async function linkDemoSlackIdentity(env: Env): Promise<typeof DEMO_USER> {
	const profile = await getProfileUser(env);
	const handle = profile.slackUsername || demoSlackUsername(profile.name);
	await env.DB.prepare(
		`UPDATE user_profile
		 SET slack_username = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
		 WHERE id = 1`,
	)
		.bind(handle)
		.run();
	return getProfileUser(env);
}

async function readJson(c: Context<{ Bindings: Env }>): Promise<Record<string, unknown> | null> {
	try {
		const body = await c.req.json();
		return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

api.post("/login", async (c) => {
	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const username = typeof body.username === "string" ? body.username.trim() : "";
	const password = typeof body.password === "string" ? body.password : "";

	if (!timingSafeEqual(username, DEMO_USERNAME) || !timingSafeEqual(password, DEMO_PASSWORD)) {
		return c.json({ error: "Incorrect email or password." }, 401);
	}

	const token = await createSessionToken(DEMO_USER.username);
	return c.json({ ok: true, token, user: await getProfileUser(c.env) });
});

api.post("/login/slack", async (c) => {
	// Demo-only: pretend Slack OAuth completed, link Slack identity, issue session.
	const token = await createSessionToken(DEMO_USER.username);
	const user = await linkDemoSlackIdentity(c.env);
	return c.json({ ok: true, token, user, provider: "slack" });
});

api.post("/register", async (c) => {
	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const name = typeof body.name === "string" ? body.name.trim() : "";
	const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
	const company = typeof body.company === "string" ? body.company.trim() : "";
	const password = typeof body.password === "string" ? body.password : "";

	if (!name || !company) return c.json({ error: "Please fill in your name and company." }, 400);
	if (!email || !EMAIL_RE.test(email)) return c.json({ error: "Please enter a valid work email address." }, 400);
	if (!password || password.length < 6) return c.json({ error: "Password must be at least 6 characters." }, 400);

	return c.json({
		ok: false,
		message:
			"Thanks! Lumantic is invite-only during our private beta, so new accounts are provisioned by the team. We'll be in touch.",
	});
});

api.get("/session", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);
	return c.json({ user: await getProfileUser(c.env), company: await getCompanySettings(c.env) });
});

api.get("/company", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);
	return c.json({ company: await getCompanySettings(c.env) });
});

api.put("/company", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const current = await getCompanySettings(c.env);

	let currency = current.displayCurrency;
	if (body.displayCurrency !== undefined) {
		const next = typeof body.displayCurrency === "string" ? body.displayCurrency.trim().toUpperCase() : "";
		if (!isDisplayCurrency(next)) {
			return c.json({ error: "Pick a supported display currency." }, 400);
		}
		currency = next;
	}

	let timeFormat = current.timeFormat;
	if (body.timeFormat !== undefined) {
		const next = typeof body.timeFormat === "string" ? body.timeFormat.trim() : "";
		if (!isTimeFormatPreference(next)) {
			return c.json({ error: "Pick auto, 12-hour, or 24-hour time." }, 400);
		}
		timeFormat = next;
	}

	let timezone = current.timezone;
	if (body.timezone !== undefined) {
		const next = typeof body.timezone === "string" ? body.timezone.trim() : "";
		if (!isTimezonePreference(next)) {
			return c.json({ error: "Pick auto or a valid timezone." }, 400);
		}
		timezone = next;
	}

	let companyName = current.companyName;
	if (body.companyName !== undefined) {
		const next = typeof body.companyName === "string" ? body.companyName.trim() : "";
		if (!next) return c.json({ error: "Company name can't be empty." }, 400);
		if (next.length > 80) return c.json({ error: "Company name is too long." }, 400);
		companyName = next;
	}

	let inviteEmailDomains = current.inviteEmailDomains;
	if (body.inviteEmailDomains !== undefined) {
		if (!Array.isArray(body.inviteEmailDomains)) {
			return c.json({ error: "Invite domains must be a list." }, 400);
		}
		const raw = body.inviteEmailDomains.filter((d): d is string => typeof d === "string");
		inviteEmailDomains = normalizeInviteEmailDomains(raw);
		if (raw.length > 0 && inviteEmailDomains.length === 0) {
			return c.json({ error: "Enter valid email domains (for example acme.com)." }, 400);
		}
	}

	const emailProposedMemories =
		typeof body.emailProposedMemories === "boolean" ? body.emailProposedMemories : current.emailProposedMemories;
	const emailDailyDigest =
		typeof body.emailDailyDigest === "boolean" ? body.emailDailyDigest : current.emailDailyDigest;
	const emailTeamInvites =
		typeof body.emailTeamInvites === "boolean" ? body.emailTeamInvites : current.emailTeamInvites;
	const emailBilling = typeof body.emailBilling === "boolean" ? body.emailBilling : current.emailBilling;

	try {
		await c.env.DB.prepare(
			`INSERT INTO company_settings (
			   id, display_currency, time_format, timezone,
			   invite_email_domains,
			   email_proposed_memories, email_daily_digest, email_team_invites, email_billing,
			   updated_at
			 )
			 VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
			 ON CONFLICT(id) DO UPDATE SET
			   display_currency = excluded.display_currency,
			   time_format = excluded.time_format,
			   timezone = excluded.timezone,
			   invite_email_domains = excluded.invite_email_domains,
			   email_proposed_memories = excluded.email_proposed_memories,
			   email_daily_digest = excluded.email_daily_digest,
			   email_team_invites = excluded.email_team_invites,
			   email_billing = excluded.email_billing,
			   updated_at = excluded.updated_at`,
		)
			.bind(
				currency,
				timeFormat,
				timezone,
				JSON.stringify(inviteEmailDomains),
				emailProposedMemories ? 1 : 0,
				emailDailyDigest ? 1 : 0,
				emailTeamInvites ? 1 : 0,
				emailBilling ? 1 : 0,
			)
			.run();

		if (body.companyName !== undefined) {
			await c.env.DB.prepare(
				`UPDATE user_profile
				 SET company = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
				 WHERE id = 1`,
			)
				.bind(companyName)
				.run();
		}

		return c.json({
			company: await getCompanySettings(c.env),
			user: await getProfileUser(c.env),
		});
	} catch (err) {
		console.error("Failed to update company settings", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/company/delete", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;
	if (auth.role !== "Owner") {
		return c.json({ error: "Only the workspace owner can delete the workspace." }, 403);
	}

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const company = await getCompanySettings(c.env);
	const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";
	if (confirmation !== company.companyName) {
		return c.json({ error: `Type "${company.companyName}" exactly to confirm.` }, 400);
	}

	// Demo: soft-delete by resetting the workspace name and signing the user out client-side.
	try {
		await c.env.DB.prepare(
			`UPDATE user_profile
			 SET company = 'Deleted workspace', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = 1`,
		).run();
		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to delete workspace", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/profile", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const name = typeof body.name === "string" ? body.name.trim() : "";
	const role = typeof body.role === "string" ? body.role.trim() : "";
	if (!name) return c.json({ error: "Name can't be empty." }, 400);
	if (!role) return c.json({ error: "Role can't be empty." }, 400);
	if (name.length > 80) return c.json({ error: "Name is too long." }, 400);
	if (role.length > 80) return c.json({ error: "Role is too long." }, 400);

	const existing = await c.env.DB.prepare("SELECT avatar FROM user_profile WHERE id = 1").first<{
		avatar: string | null;
	}>();
	let avatar = existing?.avatar ?? null;

	if (body.avatarUrl === null) {
		avatar = null;
	} else if (typeof body.avatarUrl === "string") {
		const next = body.avatarUrl.trim();
		if (!next) {
			avatar = null;
		} else if (!AVATAR_DATA_URL_RE.test(next) || next.length > MAX_AVATAR_CHARS) {
			return c.json({ error: "Profile photo must be a small JPEG, PNG, or WebP image." }, 400);
		} else {
			avatar = next;
		}
	}

	await c.env.DB.prepare(
		"UPDATE user_profile SET name = ?, role = ?, avatar = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 1",
	)
		.bind(name, role, avatar)
		.run();

	return c.json({ user: await getProfileUser(c.env) });
});

api.post("/profile/slack/connect", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const user = await linkDemoSlackIdentity(c.env);
		return c.json({ ok: true, user });
	} catch (err) {
		console.error("Failed to connect Slack identity", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/profile/slack/disconnect", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		await c.env.DB.prepare(
			`UPDATE user_profile
			 SET slack_username = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = 1`,
		).run();
		return c.json({ ok: true, user: await getProfileUser(c.env) });
	} catch (err) {
		console.error("Failed to disconnect Slack identity", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/account/delete", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";
	if (confirmation !== "delete my account") {
		return c.json({ error: 'Type "delete my account" exactly to confirm.' }, 400);
	}

	// Demo workspace: sign-out is the destructive step. Profile data stays so the shared
	// demo login keeps working for the next visitor.
	return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Slack settings
// ---------------------------------------------------------------------------

type SlackSettingsRow = {
	connected: number;
	workspace_name: string | null;
	bot_name: string;
	default_channel_id: string | null;
	default_channel_name: string | null;
	post_proposed_memories: number;
	post_daily_digest: number;
	notify_on_new_memory: number;
	updated_at: string;
};

function serializeSlackSettings(row: SlackSettingsRow | null) {
	if (!row) return null;
	return {
		connected: Boolean(row.connected),
		workspaceName: row.workspace_name,
		botName: row.bot_name,
		defaultChannelId: row.default_channel_id,
		defaultChannelName: row.default_channel_name,
		postProposedMemories: Boolean(row.post_proposed_memories),
		postDailyDigest: Boolean(row.post_daily_digest),
		notifyOnNewMemory: Boolean(row.notify_on_new_memory),
		updatedAt: row.updated_at,
	};
}

api.get("/slack", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const settings = await c.env.DB.prepare("SELECT * FROM slack_settings WHERE id = 1").first<SlackSettingsRow>();
		const channels = await c.env.DB.prepare("SELECT id, name, is_private FROM slack_channels ORDER BY name ASC").all();
		return c.json({ settings: serializeSlackSettings(settings), channels: channels.results });
	} catch (err) {
		console.error("Failed to load slack settings", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/slack/connect", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const body = (await readJson(c)) ?? {};
	const profile = await getProfileUser(c.env);
	const workspaceName =
		typeof body.workspaceName === "string" && body.workspaceName.trim() ? body.workspaceName.trim() : profile.company;

	try {
		const existing = await c.env.DB.prepare("SELECT default_channel_id FROM slack_settings WHERE id = 1").first<{
			default_channel_id: string | null;
		}>();

		let defaultChannelId = existing?.default_channel_id ?? null;
		let defaultChannelName: string | null = null;

		if (defaultChannelId) {
			const chan = await c.env.DB.prepare("SELECT name FROM slack_channels WHERE id = ?")
				.bind(defaultChannelId)
				.first<{ name: string }>();
			defaultChannelName = chan?.name ?? null;
		}
		if (!defaultChannelId || !defaultChannelName) {
			const first = await c.env.DB.prepare("SELECT id, name FROM slack_channels ORDER BY name ASC LIMIT 1").first<{
				id: string;
				name: string;
			}>();
			defaultChannelId = first?.id ?? null;
			defaultChannelName = first?.name ?? null;
		}

		await c.env.DB.prepare(
			`UPDATE slack_settings
			 SET connected = 1, workspace_name = ?, default_channel_id = ?, default_channel_name = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = 1`,
		)
			.bind(workspaceName, defaultChannelId, defaultChannelName)
			.run();

		const settings = await c.env.DB.prepare("SELECT * FROM slack_settings WHERE id = 1").first<SlackSettingsRow>();
		return c.json({ settings: serializeSlackSettings(settings) });
	} catch (err) {
		console.error("Failed to connect slack", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/slack/disconnect", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	try {
		await c.env.DB.prepare(
			`UPDATE slack_settings SET connected = 0, workspace_name = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 1`,
		).run();
		const settings = await c.env.DB.prepare("SELECT * FROM slack_settings WHERE id = 1").first<SlackSettingsRow>();
		return c.json({ settings: serializeSlackSettings(settings) });
	} catch (err) {
		console.error("Failed to disconnect slack", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/slack", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const sets: string[] = [];
	const binds: unknown[] = [];

	if (typeof body.botName === "string" && body.botName.trim()) {
		sets.push("bot_name = ?");
		binds.push(body.botName.trim().slice(0, 80));
	}
	if (typeof body.defaultChannelId === "string" && body.defaultChannelId) {
		try {
			const chan = await c.env.DB.prepare("SELECT name FROM slack_channels WHERE id = ?")
				.bind(body.defaultChannelId)
				.first<{
					name: string;
				}>();
			if (!chan) return c.json({ error: "Unknown channel" }, 400);
			sets.push("default_channel_id = ?", "default_channel_name = ?");
			binds.push(body.defaultChannelId, chan.name);
		} catch (err) {
			console.error("Failed to look up channel", err);
			return c.json({ error: "Something went wrong" }, 500);
		}
	}
	if (typeof body.postProposedMemories === "boolean") {
		sets.push("post_proposed_memories = ?");
		binds.push(body.postProposedMemories ? 1 : 0);
	}
	if (typeof body.postDailyDigest === "boolean") {
		sets.push("post_daily_digest = ?");
		binds.push(body.postDailyDigest ? 1 : 0);
	}
	if (typeof body.notifyOnNewMemory === "boolean") {
		sets.push("notify_on_new_memory = ?");
		binds.push(body.notifyOnNewMemory ? 1 : 0);
	}

	if (sets.length === 0) return c.json({ error: "No changes provided" }, 400);
	sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");

	try {
		await c.env.DB.prepare(`UPDATE slack_settings SET ${sets.join(", ")} WHERE id = 1`)
			.bind(...binds)
			.run();
		const settings = await c.env.DB.prepare("SELECT * FROM slack_settings WHERE id = 1").first<SlackSettingsRow>();
		return c.json({ settings: serializeSlackSettings(settings) });
	} catch (err) {
		console.error("Failed to update slack settings", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// GitHub settings
// ---------------------------------------------------------------------------

type GitHubSettingsRow = {
	connected: number;
	org_name: string | null;
	account_login: string | null;
	default_repo_id: string | null;
	default_repo_name: string | null;
	sync_metric_defs: number;
	comment_on_analytics_prs: number;
	watch_schema_changes: number;
	updated_at: string;
};

function serializeGitHubSettings(row: GitHubSettingsRow | null) {
	if (!row) return null;
	return {
		connected: Boolean(row.connected),
		orgName: row.org_name,
		accountLogin: row.account_login,
		defaultRepoId: row.default_repo_id,
		defaultRepoName: row.default_repo_name,
		syncMetricDefs: Boolean(row.sync_metric_defs),
		commentOnAnalyticsPrs: Boolean(row.comment_on_analytics_prs),
		watchSchemaChanges: Boolean(row.watch_schema_changes),
		updatedAt: row.updated_at,
	};
}

api.get("/github", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const settings = await c.env.DB.prepare("SELECT * FROM github_settings WHERE id = 1").first<GitHubSettingsRow>();
		const repos = await c.env.DB.prepare(
			"SELECT id, name, full_name, private FROM github_repos ORDER BY name ASC",
		).all();
		return c.json({ settings: serializeGitHubSettings(settings), repos: repos.results });
	} catch (err) {
		console.error("Failed to load github settings", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/github/connect", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const body = (await readJson(c)) ?? {};
	const profile = await getProfileUser(c.env);
	const orgName =
		typeof body.orgName === "string" && body.orgName.trim()
			? body.orgName.trim().slice(0, 80)
			: profile.company.toLowerCase().replace(/\s+/g, "-");
	const accountLogin =
		typeof body.accountLogin === "string" && body.accountLogin.trim() ? body.accountLogin.trim().slice(0, 80) : orgName;

	try {
		const existing = await c.env.DB.prepare("SELECT default_repo_id FROM github_settings WHERE id = 1").first<{
			default_repo_id: string | null;
		}>();

		let defaultRepoId = existing?.default_repo_id ?? null;
		let defaultRepoName: string | null = null;

		if (defaultRepoId) {
			const repo = await c.env.DB.prepare("SELECT name FROM github_repos WHERE id = ?")
				.bind(defaultRepoId)
				.first<{ name: string }>();
			defaultRepoName = repo?.name ?? null;
		}
		if (!defaultRepoId || !defaultRepoName) {
			const first = await c.env.DB.prepare("SELECT id, name FROM github_repos ORDER BY name ASC LIMIT 1").first<{
				id: string;
				name: string;
			}>();
			defaultRepoId = first?.id ?? null;
			defaultRepoName = first?.name ?? null;
		}

		await c.env.DB.prepare(
			`UPDATE github_settings
			 SET connected = 1, org_name = ?, account_login = ?, default_repo_id = ?, default_repo_name = ?,
			     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = 1`,
		)
			.bind(orgName, accountLogin, defaultRepoId, defaultRepoName)
			.run();

		const settings = await c.env.DB.prepare("SELECT * FROM github_settings WHERE id = 1").first<GitHubSettingsRow>();
		return c.json({ settings: serializeGitHubSettings(settings) });
	} catch (err) {
		console.error("Failed to connect github", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/github/disconnect", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	try {
		await c.env.DB.prepare(
			`UPDATE github_settings
			 SET connected = 0, org_name = NULL, account_login = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = 1`,
		).run();
		const settings = await c.env.DB.prepare("SELECT * FROM github_settings WHERE id = 1").first<GitHubSettingsRow>();
		return c.json({ settings: serializeGitHubSettings(settings) });
	} catch (err) {
		console.error("Failed to disconnect github", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/github", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const sets: string[] = [];
	const binds: unknown[] = [];

	if (typeof body.defaultRepoId === "string" && body.defaultRepoId) {
		try {
			const repo = await c.env.DB.prepare("SELECT name FROM github_repos WHERE id = ?").bind(body.defaultRepoId).first<{
				name: string;
			}>();
			if (!repo) return c.json({ error: "Unknown repository" }, 400);
			sets.push("default_repo_id = ?", "default_repo_name = ?");
			binds.push(body.defaultRepoId, repo.name);
		} catch (err) {
			console.error("Failed to look up github repo", err);
			return c.json({ error: "Something went wrong" }, 500);
		}
	}
	if (typeof body.syncMetricDefs === "boolean") {
		sets.push("sync_metric_defs = ?");
		binds.push(body.syncMetricDefs ? 1 : 0);
	}
	if (typeof body.commentOnAnalyticsPrs === "boolean") {
		sets.push("comment_on_analytics_prs = ?");
		binds.push(body.commentOnAnalyticsPrs ? 1 : 0);
	}
	if (typeof body.watchSchemaChanges === "boolean") {
		sets.push("watch_schema_changes = ?");
		binds.push(body.watchSchemaChanges ? 1 : 0);
	}

	if (sets.length === 0) return c.json({ error: "No changes provided" }, 400);
	sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");

	try {
		await c.env.DB.prepare(`UPDATE github_settings SET ${sets.join(", ")} WHERE id = 1`)
			.bind(...binds)
			.run();
		const settings = await c.env.DB.prepare("SELECT * FROM github_settings WHERE id = 1").first<GitHubSettingsRow>();
		return c.json({ settings: serializeGitHubSettings(settings) });
	} catch (err) {
		console.error("Failed to update github settings", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Datadog settings
// ---------------------------------------------------------------------------

type DatadogSettingsRow = {
	connected: number;
	org_name: string | null;
	site: string;
	default_service: string | null;
	sync_apm_errors: number;
	sync_slo_breaches: number;
	use_in_chat: number;
	updated_at: string;
};

const DATADOG_SITES = new Set([
	"datadoghq.com",
	"datadoghq.eu",
	"us3.datadoghq.com",
	"us5.datadoghq.com",
	"ap1.datadoghq.com",
]);

function serializeDatadogSettings(row: DatadogSettingsRow | null) {
	if (!row) return null;
	return {
		connected: Boolean(row.connected),
		orgName: row.org_name,
		site: row.site,
		defaultService: row.default_service,
		syncApmErrors: Boolean(row.sync_apm_errors),
		syncSloBreaches: Boolean(row.sync_slo_breaches),
		useInChat: Boolean(row.use_in_chat),
		updatedAt: row.updated_at,
	};
}

api.get("/datadog", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const settings = await c.env.DB.prepare("SELECT * FROM datadog_settings WHERE id = 1").first<DatadogSettingsRow>();
		const services = await c.env.DB.prepare("SELECT id, name, env FROM datadog_services ORDER BY name ASC").all();
		return c.json({ settings: serializeDatadogSettings(settings), services: services.results });
	} catch (err) {
		console.error("Failed to load datadog settings", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/datadog/connect", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const body = (await readJson(c)) ?? {};
	const profile = await getProfileUser(c.env);
	const orgName =
		typeof body.orgName === "string" && body.orgName.trim() ? body.orgName.trim().slice(0, 80) : profile.company;
	const site = typeof body.site === "string" && DATADOG_SITES.has(body.site) ? body.site : "datadoghq.com";

	try {
		const existing = await c.env.DB.prepare("SELECT default_service FROM datadog_settings WHERE id = 1").first<{
			default_service: string | null;
		}>();

		let defaultService = existing?.default_service ?? null;
		if (defaultService) {
			const svc = await c.env.DB.prepare("SELECT name FROM datadog_services WHERE name = ?")
				.bind(defaultService)
				.first();
			if (!svc) defaultService = null;
		}
		if (!defaultService) {
			const first = await c.env.DB.prepare("SELECT name FROM datadog_services ORDER BY name ASC LIMIT 1").first<{
				name: string;
			}>();
			defaultService = first?.name ?? null;
		}

		await c.env.DB.prepare(
			`UPDATE datadog_settings
			 SET connected = 1, org_name = ?, site = ?, default_service = ?,
			     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = 1`,
		)
			.bind(orgName, site, defaultService)
			.run();

		const settings = await c.env.DB.prepare("SELECT * FROM datadog_settings WHERE id = 1").first<DatadogSettingsRow>();
		return c.json({ settings: serializeDatadogSettings(settings) });
	} catch (err) {
		console.error("Failed to connect datadog", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/datadog/disconnect", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	try {
		await c.env.DB.prepare(
			`UPDATE datadog_settings
			 SET connected = 0, org_name = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = 1`,
		).run();
		const settings = await c.env.DB.prepare("SELECT * FROM datadog_settings WHERE id = 1").first<DatadogSettingsRow>();
		return c.json({ settings: serializeDatadogSettings(settings) });
	} catch (err) {
		console.error("Failed to disconnect datadog", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/datadog", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const sets: string[] = [];
	const binds: unknown[] = [];

	if (typeof body.site === "string" && DATADOG_SITES.has(body.site)) {
		sets.push("site = ?");
		binds.push(body.site);
	}
	if (typeof body.defaultService === "string" && body.defaultService) {
		try {
			const svc = await c.env.DB.prepare("SELECT name FROM datadog_services WHERE name = ?")
				.bind(body.defaultService)
				.first();
			if (!svc) return c.json({ error: "Unknown service" }, 400);
			sets.push("default_service = ?");
			binds.push(body.defaultService);
		} catch (err) {
			console.error("Failed to look up datadog service", err);
			return c.json({ error: "Something went wrong" }, 500);
		}
	}
	if (typeof body.syncApmErrors === "boolean") {
		sets.push("sync_apm_errors = ?");
		binds.push(body.syncApmErrors ? 1 : 0);
	}
	if (typeof body.syncSloBreaches === "boolean") {
		sets.push("sync_slo_breaches = ?");
		binds.push(body.syncSloBreaches ? 1 : 0);
	}
	if (typeof body.useInChat === "boolean") {
		sets.push("use_in_chat = ?");
		binds.push(body.useInChat ? 1 : 0);
	}

	if (sets.length === 0) return c.json({ error: "No changes provided" }, 400);
	sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");

	try {
		await c.env.DB.prepare(`UPDATE datadog_settings SET ${sets.join(", ")} WHERE id = 1`)
			.bind(...binds)
			.run();
		const settings = await c.env.DB.prepare("SELECT * FROM datadog_settings WHERE id = 1").first<DatadogSettingsRow>();
		return c.json({ settings: serializeDatadogSettings(settings) });
	} catch (err) {
		console.error("Failed to update datadog settings", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Data sources (warehouses / remote DBs)
// ---------------------------------------------------------------------------

type DataSourceRow = {
	id: string;
	label: string;
	kind: string;
	connected: number;
	display_name: string | null;
	host: string | null;
	database_name: string | null;
	schema_name: string | null;
	read_only: number;
	use_for_chat: number;
	updated_at: string;
};

const DATA_SOURCE_KINDS = new Set(["warehouse", "database", "lakehouse"]);

function serializeDataSource(row: DataSourceRow) {
	return {
		id: row.id,
		label: row.label,
		kind: DATA_SOURCE_KINDS.has(row.kind) ? row.kind : "database",
		connected: Boolean(row.connected),
		displayName: row.display_name,
		host: row.host,
		databaseName: row.database_name,
		schemaName: row.schema_name,
		readOnly: Boolean(row.read_only),
		useForChat: Boolean(row.use_for_chat),
		updatedAt: row.updated_at,
	};
}

api.get("/data-sources", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const rows = await c.env.DB.prepare(
			`SELECT id, label, kind, connected, display_name, host, database_name, schema_name, read_only, use_for_chat, updated_at
			 FROM data_sources
			 ORDER BY connected DESC, label ASC`,
		).all<DataSourceRow>();
		return c.json({ sources: (rows.results ?? []).map(serializeDataSource) });
	} catch (err) {
		console.error("Failed to list data sources", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/data-sources/:id/connect", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const id = c.req.param("id");
	const body = (await readJson(c)) ?? {};
	const profile = await getProfileUser(c.env);

	try {
		const existing = await c.env.DB.prepare("SELECT * FROM data_sources WHERE id = ?").bind(id).first<DataSourceRow>();
		if (!existing) return c.json({ error: "Unknown data source" }, 404);

		const displayName =
			typeof body.displayName === "string" && body.displayName.trim()
				? body.displayName.trim().slice(0, 80)
				: `${profile.company} ${existing.label}`;

		await c.env.DB.prepare(
			`UPDATE data_sources
			 SET connected = 1, display_name = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = ?`,
		)
			.bind(displayName, id)
			.run();

		const row = await c.env.DB.prepare("SELECT * FROM data_sources WHERE id = ?").bind(id).first<DataSourceRow>();
		return c.json({ source: row ? serializeDataSource(row) : null });
	} catch (err) {
		console.error("Failed to connect data source", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/data-sources/:id/disconnect", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const id = c.req.param("id");

	try {
		const existing = await c.env.DB.prepare("SELECT id FROM data_sources WHERE id = ?").bind(id).first();
		if (!existing) return c.json({ error: "Unknown data source" }, 404);

		await c.env.DB.prepare(
			`UPDATE data_sources
			 SET connected = 0, display_name = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = ?`,
		)
			.bind(id)
			.run();

		const row = await c.env.DB.prepare("SELECT * FROM data_sources WHERE id = ?").bind(id).first<DataSourceRow>();
		return c.json({ source: row ? serializeDataSource(row) : null });
	} catch (err) {
		console.error("Failed to disconnect data source", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/data-sources/:id", async (c) => {
	const auth = await requireWorkspaceAdmin(c);
	if (auth.error) return auth.error;

	const id = c.req.param("id");
	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	try {
		const existing = await c.env.DB.prepare("SELECT id FROM data_sources WHERE id = ?").bind(id).first();
		if (!existing) return c.json({ error: "Unknown data source" }, 404);

		const sets: string[] = [];
		const binds: unknown[] = [];

		if (typeof body.displayName === "string" && body.displayName.trim()) {
			sets.push("display_name = ?");
			binds.push(body.displayName.trim().slice(0, 80));
		}
		if (typeof body.databaseName === "string" && body.databaseName.trim()) {
			sets.push("database_name = ?");
			binds.push(body.databaseName.trim().slice(0, 120));
		}
		if (typeof body.schemaName === "string" && body.schemaName.trim()) {
			sets.push("schema_name = ?");
			binds.push(body.schemaName.trim().slice(0, 120));
		}
		if (typeof body.readOnly === "boolean") {
			sets.push("read_only = ?");
			binds.push(body.readOnly ? 1 : 0);
		}
		if (typeof body.useForChat === "boolean") {
			sets.push("use_for_chat = ?");
			binds.push(body.useForChat ? 1 : 0);
		}

		if (sets.length === 0) return c.json({ error: "No changes provided" }, 400);
		sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
		binds.push(id);

		await c.env.DB.prepare(`UPDATE data_sources SET ${sets.join(", ")} WHERE id = ?`)
			.bind(...binds)
			.run();

		const row = await c.env.DB.prepare("SELECT * FROM data_sources WHERE id = ?").bind(id).first<DataSourceRow>();
		return c.json({ source: row ? serializeDataSource(row) : null });
	} catch (err) {
		console.error("Failed to update data source", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------

api.get("/memories", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const q = (c.req.query("q") ?? "").trim().toLowerCase();
	try {
		const rows = q
			? await c.env.DB.prepare("SELECT * FROM memories WHERE LOWER(content) LIKE ? ORDER BY created_at DESC")
					.bind(`%${q}%`)
					.all()
			: await c.env.DB.prepare("SELECT * FROM memories ORDER BY created_at DESC").all();
		return c.json({ memories: rows.results });
	} catch (err) {
		console.error("Failed to list memories", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/memories", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const content = typeof body.content === "string" ? body.content.trim() : "";
	const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "general";
	const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "manual";

	if (!content) return c.json({ error: "Memory content can't be empty" }, 400);

	try {
		const profile = await getProfileUser(c.env);
		const addedBy = source === "ai" || source === "ai-chat" ? "Lumantic" : profile.name;
		const result = await c.env.DB.prepare(
			"INSERT INTO memories (content, category, source, added_by) VALUES (?, ?, ?, ?) RETURNING *",
		)
			.bind(content, category, source, addedBy)
			.first();
		return c.json({ memory: result });
	} catch (err) {
		console.error("Failed to create memory", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/memories/:id", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const content = typeof body.content === "string" ? body.content.trim() : "";
	const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "general";

	if (!content) return c.json({ error: "Memory content can't be empty" }, 400);

	try {
		const result = await c.env.DB.prepare(
			`UPDATE memories SET content = ?, category = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? RETURNING *`,
		)
			.bind(content, category, id)
			.first();
		if (!result) return c.json({ error: "Memory not found" }, 404);
		return c.json({ memory: result });
	} catch (err) {
		console.error("Failed to update memory", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.delete("/memories/:id", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	try {
		await c.env.DB.prepare("DELETE FROM memories WHERE id = ?").bind(id).run();
		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to delete memory", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Proposed memories
// ---------------------------------------------------------------------------

api.get("/proposed-memories", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const rows = await c.env.DB.prepare("SELECT * FROM proposed_memories ORDER BY created_at DESC").all();
		return c.json({ proposedMemories: rows.results });
	} catch (err) {
		console.error("Failed to list proposed memories", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/proposed-memories", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const content = typeof body.content === "string" ? body.content.trim() : "";
	const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "general";
	const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "ai-chat";
	const confidence = typeof body.confidence === "number" ? Math.min(1, Math.max(0, body.confidence)) : 0.6;

	if (!content) return c.json({ error: "Memory content can't be empty" }, 400);

	try {
		const result = await c.env.DB.prepare(
			"INSERT INTO proposed_memories (content, category, source, confidence) VALUES (?, ?, ?, ?) RETURNING *",
		)
			.bind(content, category, source, confidence)
			.first();
		return c.json({ proposedMemory: result });
	} catch (err) {
		console.error("Failed to create proposed memory", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/proposed-memories/:id/approve", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	const body = (await readJson(c)) ?? {};

	try {
		const proposed = await c.env.DB.prepare("SELECT * FROM proposed_memories WHERE id = ?").bind(id).first<{
			content: string;
			category: string;
			source: string;
		}>();
		if (!proposed) return c.json({ error: "Proposed memory not found" }, 404);

		const content = typeof body.content === "string" && body.content.trim() ? body.content.trim() : proposed.content;
		const category =
			typeof body.category === "string" && body.category.trim() ? body.category.trim() : proposed.category;
		const profile = await getProfileUser(c.env);

		const memory = await c.env.DB.prepare(
			"INSERT INTO memories (content, category, source, added_by) VALUES (?, ?, ?, ?) RETURNING *",
		)
			.bind(content, category, proposed.source, profile.name)
			.first();
		await c.env.DB.prepare("DELETE FROM proposed_memories WHERE id = ?").bind(id).run();

		return c.json({ memory });
	} catch (err) {
		console.error("Failed to approve proposed memory", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.delete("/proposed-memories/:id", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	try {
		await c.env.DB.prepare("DELETE FROM proposed_memories WHERE id = ?").bind(id).run();
		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to deny proposed memory", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Chat (simulated AI analyst)
// ---------------------------------------------------------------------------

async function generateAssistantReply(
	env: Env,
	userText: string,
): Promise<{
	content: string;
	suggestedMemory: string | null;
	artifact: string | null;
	working: ChatWorking;
	confidence: number;
}> {
	const text = userText.trim();
	const lower = text.toLowerCase();

	const analytics = matchBeaconAnalyticsQuestion(text);
	if (analytics) {
		return {
			content: analytics.content,
			suggestedMemory: analytics.suggestedMemory,
			artifact: analytics.artifact ? JSON.stringify(analytics.artifact) : null,
			working: analytics.working,
			confidence: 0.94,
		};
	}

	if (lower.length < 3 || /^(hi|hello|hey|yo|sup)\b/.test(lower)) {
		return {
			content:
				"Hey — I'm Lumantic for the **Beacon** data team. Ask about Beacon signups, sessions, crashes, or any metric definition we've confirmed, and I'll pull charts and tables when I can.",
			suggestedMemory: null,
			artifact: null,
			working: genericWorking("greeting"),
			confidence: 0.82,
		};
	}

	if (lower.includes("slack")) {
		const settings = await env.DB.prepare("SELECT * FROM slack_settings WHERE id = 1").first<SlackSettingsRow>();
		if (settings?.connected) {
			const extras = [
				settings.post_proposed_memories ? "new proposed memories for review" : null,
				settings.post_daily_digest ? "a daily digest" : null,
			].filter(Boolean);
			return {
				content: `You're connected to **${settings.workspace_name}**. I post to #${settings.default_channel_name ?? "your default channel"} as **${settings.bot_name}**${
					extras.length ? `, including ${extras.join(" and ")}` : ""
				}. You can change any of this from Settings.`,
				suggestedMemory: null,
				artifact: null,
				working: genericWorking("slack"),
				confidence: 0.97,
			};
		}
		return {
			content:
				"Slack isn't connected yet. Head to Settings → Slack integration to connect your workspace and pick a channel, and I'll start posting memories and digests there.",
			suggestedMemory: null,
			artifact: null,
			working: genericWorking("slack"),
			confidence: 0.96,
		};
	}

	if (/\bgithub\b|\bgit\s*hub\b/.test(lower)) {
		const settings = await env.DB.prepare("SELECT * FROM github_settings WHERE id = 1").first<GitHubSettingsRow>();
		if (settings?.connected) {
			const extras = [
				settings.sync_metric_defs ? "syncing metric definitions from PRs" : null,
				settings.comment_on_analytics_prs ? "commenting on analytics PRs" : null,
				settings.watch_schema_changes ? "watching schema changes" : null,
			].filter(Boolean);
			return {
				content: `GitHub is connected for **${settings.org_name}** (as **${settings.account_login}**). Default repo is **${settings.default_repo_name ?? "unset"}**${
					extras.length ? `, with ${extras.join(", ")}` : ""
				}. You can change any of this from Settings.`,
				suggestedMemory: null,
				artifact: null,
				working: genericWorking("github"),
				confidence: 0.97,
			};
		}
		return {
			content:
				"GitHub isn't connected yet. Head to Settings → GitHub integration to install the Lumantic GitHub App on your org and pick a default repo.",
			suggestedMemory: null,
			artifact: null,
			working: genericWorking("github"),
			confidence: 0.96,
		};
	}

	if (/\bdatadog\b/.test(lower)) {
		const settings = await env.DB.prepare("SELECT * FROM datadog_settings WHERE id = 1").first<DatadogSettingsRow>();
		if (settings?.connected) {
			const extras = [
				settings.sync_apm_errors ? "syncing APM errors" : null,
				settings.sync_slo_breaches ? "syncing SLO breaches" : null,
				settings.use_in_chat ? "available in chat" : null,
			].filter(Boolean);
			return {
				content: `Datadog is connected for **${settings.org_name}** on **${settings.site}**. Default service is **${settings.default_service ?? "unset"}**${
					extras.length ? `, with ${extras.join(", ")}` : ""
				}. You can change any of this from Settings.`,
				suggestedMemory: null,
				artifact: null,
				working: genericWorking("datadog"),
				confidence: 0.97,
			};
		}
		return {
			content:
				"Datadog isn't connected yet. Head to Settings → Datadog integration to link your org, pick a site, and choose a default service.",
			suggestedMemory: null,
			artifact: null,
			working: genericWorking("datadog"),
			confidence: 0.96,
		};
	}

	if (/\b(snowflake|bigquery|redshift|databricks|postgres|mysql|warehouse|data\s*source|remote\s*db)\b/.test(lower)) {
		try {
			const rows = await env.DB.prepare(
				`SELECT label, connected, display_name, database_name, schema_name, use_for_chat
				 FROM data_sources
				 ORDER BY connected DESC, label ASC`,
			).all<{
				label: string;
				connected: number;
				display_name: string | null;
				database_name: string | null;
				schema_name: string | null;
				use_for_chat: number;
			}>();
			const sources = rows.results ?? [];
			const connected = sources.filter((s) => s.connected);
			if (connected.length > 0) {
				const list = connected
					.map((s) => {
						const scope = [s.database_name, s.schema_name].filter(Boolean).join(".");
						return `**${s.display_name ?? s.label}**${scope ? ` (\`${scope}\`)` : ""}${s.use_for_chat ? "" : " · chat off"}`;
					})
					.join("\n- ");
				return {
					content: `You have **${connected.length}** data source${connected.length === 1 ? "" : "s"} connected:\n\n- ${list}\n\nManage these from Settings → Data sources.`,
					suggestedMemory: null,
					artifact: null,
					working: genericWorking("data_sources"),
					confidence: 0.96,
				};
			}
			return {
				content:
					"No warehouses or remote databases are connected yet. Head to Settings → Data sources to connect Snowflake, BigQuery, Postgres, Redshift, Databricks, or MySQL.",
				suggestedMemory: null,
				artifact: null,
				working: genericWorking("data_sources"),
				confidence: 0.95,
			};
		} catch (err) {
			console.error("Failed to load data sources for chat reply", err);
		}
	}

	if (/\bmemor(y|ies)\b/.test(lower) && !/\b(remember|note|fyi)\b/.test(lower)) {
		const [memCount, proposedCount] = await Promise.all([
			env.DB.prepare("SELECT COUNT(*) as n FROM memories").first<{ n: number }>(),
			env.DB.prepare("SELECT COUNT(*) as n FROM proposed_memories").first<{ n: number }>(),
		]);
		return {
			content: `I'm holding **${memCount?.n ?? 0} confirmed memories** and **${proposedCount?.n ?? 0} proposed** ones waiting on your review for Beacon. You can browse, edit, or delete any of them from the Memories tab.`,
			suggestedMemory: null,
			artifact: null,
			working: genericWorking("memory_meta"),
			confidence: 0.91,
		};
	}

	try {
		const memories = await env.DB.prepare("SELECT content FROM memories ORDER BY created_at DESC").all<{
			content: string;
		}>();
		const userWords = tokenize(text);
		let best: { content: string; score: number } | null = null;
		for (const row of memories.results) {
			const memoryWords = tokenize(row.content);
			let score = 0;
			for (const userWord of userWords) {
				if (memoryWords.some((memoryWord) => wordsMatch(userWord, memoryWord))) score += userWord.length;
			}
			if (score > 0 && (!best || score > best.score)) best = { content: row.content, score };
		}
		if (best) {
			const confidence = Math.min(0.95, Math.max(0.68, 0.55 + best.score * 0.025));
			return {
				content: `Here's what I have on record for Beacon:\n\n> ${best.content}`,
				suggestedMemory: null,
				artifact: null,
				working: memoryLookupWorking(best.content),
				confidence: Math.round(confidence * 100) / 100,
			};
		}
	} catch (err) {
		console.error("Failed to search memories for chat reply", err);
	}

	return {
		content:
			"I don't have a confirmed Beacon memory about that yet. Want me to flag it for the team to review? I'll drop it in Proposed Memories.",
		suggestedMemory: text.slice(0, 500),
		artifact: null,
		working: genericWorking("fallback"),
		confidence: 0.32,
	};
}

api.get("/conversations", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const scope = c.req.query("scope") === "global" ? "global" : "personal";
	const archivedParam = c.req.query("archived");
	const archivedFilter = archivedParam === "1" || archivedParam === "true" ? 1 : archivedParam === "all" ? null : 0;
	const page = clampPage(c.req.query("page"));
	const pageSize = clampPageSize(c.req.query("pageSize"), 20, 100);
	const offset = (page - 1) * pageSize;

	try {
		const whereArchived = archivedFilter === null ? "" : "AND c.archived = ?";
		const countBindings = archivedFilter === null ? [scope] : [scope, archivedFilter];
		const listBindings =
			archivedFilter === null ? [scope, pageSize, offset] : [scope, archivedFilter, pageSize, offset];

		const countRow = await c.env.DB.prepare(
			`SELECT COUNT(*) AS total FROM conversations c WHERE c.scope = ? ${whereArchived}`,
		)
			.bind(...countBindings)
			.first<{ total: number }>();

		const rows = await c.env.DB.prepare(
			`SELECT c.id, c.title, c.scope, c.author_name, c.author_slack_username, c.source_kind, c.source_channel,
			        c.pinned, c.archived, c.last_read_at, c.created_at, c.updated_at,
			        (
			          SELECT COUNT(*) FROM chat_messages m
			          WHERE m.conversation_id = c.id
			            AND m.role = 'assistant'
			            AND (c.last_read_at IS NULL OR m.created_at > c.last_read_at)
			        ) AS unread
			 FROM conversations c
			 WHERE c.scope = ? ${whereArchived}
			 ORDER BY c.pinned DESC, c.updated_at DESC, c.id DESC
			 LIMIT ? OFFSET ?`,
		)
			.bind(...listBindings)
			.all();
		return c.json({
			conversations: rows.results,
			total: countRow?.total ?? 0,
			page,
			pageSize,
		});
	} catch (err) {
		console.error("Failed to list conversations", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.get("/conversations/unread-count", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const row = await c.env.DB.prepare(
			`SELECT COUNT(*) AS n
			 FROM conversations c
			 WHERE c.archived = 0
			   AND EXISTS (
			     SELECT 1 FROM chat_messages m
			     WHERE m.conversation_id = c.id
			       AND m.role = 'assistant'
			       AND (c.last_read_at IS NULL OR m.created_at > c.last_read_at)
			   )`,
		).first<{ n: number }>();
		return c.json({ unreadCount: row?.n ?? 0 });
	} catch (err) {
		console.error("Failed to count unread conversations", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/conversations/mark-all-read", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		await c.env.DB.prepare(`UPDATE conversations SET last_read_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`).run();
		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to mark conversations read", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/conversations", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	const scope = body?.scope === "global" ? "global" : "personal";
	const profile = await getProfileUser(c.env);
	const authorName = scope === "global" ? profile.name : null;

	try {
		const conversation = await c.env.DB.prepare(
			`INSERT INTO conversations (title, scope, author_name, last_read_at)
			 VALUES ('New chat', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
			 RETURNING id, title, scope, author_name, pinned, archived, last_read_at, created_at, updated_at`,
		)
			.bind(scope, authorName)
			.first();
		return c.json({ conversation: conversation ? { ...conversation, unread: 0 } : conversation });
	} catch (err) {
		console.error("Failed to create conversation", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/conversations/import", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : "Imported chat";
	const scope = body.scope === "global" ? "global" : "personal";
	const messages = Array.isArray(body.messages) ? body.messages : [];
	const profile = await getProfileUser(c.env);
	const authorName = scope === "global" ? profile.name : null;

	try {
		const conversation = await c.env.DB.prepare(
			`INSERT INTO conversations (title, scope, author_name, last_read_at)
			 VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
			 RETURNING id, title, scope, author_name, pinned, archived, last_read_at, created_at, updated_at`,
		)
			.bind(title, scope, authorName)
			.first<{ id: number }>();

		if (!conversation) return c.json({ error: "Failed to create conversation" }, 500);

		let lastUserContent = "";
		for (const raw of messages) {
			if (!raw || typeof raw !== "object") continue;
			const role = raw.role === "assistant" ? "assistant" : raw.role === "user" ? "user" : null;
			const content = typeof raw.content === "string" ? raw.content : "";
			if (!role || !content) continue;
			const suggested = typeof raw.suggested_memory === "string" ? raw.suggested_memory : null;
			const artifact = typeof raw.artifact === "string" ? raw.artifact : null;
			const working = typeof raw.working === "string" ? raw.working : null;
			const confidence =
				role === "assistant" && typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
					? Math.min(1, Math.max(0, raw.confidence))
					: role === "assistant"
						? 0.9
						: null;
			if (role === "user") lastUserContent = content;
			const usage = role === "assistant" ? estimateReplyUsage(lastUserContent, content) : null;
			await c.env.DB.prepare(
				`INSERT INTO chat_messages (conversation_id, role, content, suggested_memory, artifact, working, confidence, input_tokens, output_tokens, cost_usd, latency_ms)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
				.bind(
					conversation.id,
					role,
					content,
					suggested,
					artifact,
					working,
					confidence,
					usage?.inputTokens ?? null,
					usage?.outputTokens ?? null,
					usage?.costUsd ?? null,
					usage?.latencyMs ?? null,
				)
				.run();
		}

		const full = await c.env.DB.prepare(
			`SELECT id, title, scope, author_name, pinned, archived, last_read_at, created_at, updated_at FROM conversations WHERE id = ?`,
		)
			.bind(conversation.id)
			.first();
		return c.json({ conversation: full ? { ...full, unread: 0 } : full });
	} catch (err) {
		console.error("Failed to import conversation", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/conversations/:id", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	const body = (await readJson(c)) ?? {};

	try {
		const existing = await c.env.DB.prepare(
			"SELECT id, title, scope, author_name, pinned, archived FROM conversations WHERE id = ?",
		)
			.bind(id)
			.first<{
				id: number;
				title: string;
				scope: string;
				author_name: string | null;
				pinned: number;
				archived: number;
			}>();
		if (!existing) return c.json({ error: "Conversation not found" }, 404);

		let scope = existing.scope;
		let authorName = existing.author_name;
		let pinned = existing.pinned;
		let archived = existing.archived;

		if (typeof body.pinned === "boolean") pinned = body.pinned ? 1 : 0;
		if (typeof body.archived === "boolean") archived = body.archived ? 1 : 0;

		if (body.scope === "global" || body.scope === "personal") {
			scope = body.scope;
			if (scope === "global") {
				const profile = await getProfileUser(c.env);
				authorName = profile.name;
			} else {
				authorName = null;
			}
		}

		await c.env.DB.prepare(
			`UPDATE conversations
			 SET scope = ?, author_name = ?, pinned = ?, archived = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = ?`,
		)
			.bind(scope, authorName, pinned, archived, id)
			.run();

		const conversation = await c.env.DB.prepare(
			`SELECT id, title, scope, author_name, pinned, archived, last_read_at, created_at, updated_at FROM conversations WHERE id = ?`,
		)
			.bind(id)
			.first();
		return c.json({ conversation: conversation ? { ...conversation, unread: 0 } : conversation });
	} catch (err) {
		console.error("Failed to update conversation", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.delete("/conversations/:id", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	try {
		const conversation = await c.env.DB.prepare("SELECT scope FROM conversations WHERE id = ?")
			.bind(id)
			.first<{ scope: string }>();
		if (!conversation) return c.json({ error: "Conversation not found" }, 404);

		await c.env.DB.batch([
			c.env.DB.prepare("DELETE FROM chat_messages WHERE conversation_id = ?").bind(id),
			c.env.DB.prepare("DELETE FROM conversations WHERE id = ?").bind(id),
		]);
		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to delete conversation", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.get("/conversations/:id/messages", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	const wantAll = c.req.query("all") === "1" || c.req.query("all") === "true";
	const beforeRaw = c.req.query("before");
	const before = beforeRaw != null && beforeRaw !== "" ? Number(beforeRaw) : null;
	if (before != null && !Number.isInteger(before)) return c.json({ error: "Invalid before" }, 400);
	const limit = clampLimit(c.req.query("limit"), 40, 100);

	try {
		const markRead = before == null;
		if (wantAll) {
			const rows = await c.env.DB.prepare(
				"SELECT id, role, content, suggested_memory, artifact, working, confidence, input_tokens, output_tokens, cost_usd, latency_ms, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC",
			)
				.bind(id)
				.all();
			if (markRead) {
				await c.env.DB.prepare(
					`UPDATE conversations SET last_read_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
				)
					.bind(id)
					.run();
			}
			return c.json({ messages: rows.results, hasMore: false });
		}

		const whereBefore = before != null ? "AND id < ?" : "";
		const bindings = before != null ? [id, before, limit + 1] : [id, limit + 1];
		const rows = await c.env.DB.prepare(
			`SELECT id, role, content, suggested_memory, artifact, working, confidence, input_tokens, output_tokens, cost_usd, latency_ms, created_at
			 FROM chat_messages
			 WHERE conversation_id = ? ${whereBefore}
			 ORDER BY id DESC
			 LIMIT ?`,
		)
			.bind(...bindings)
			.all();

		const batch = (rows.results ?? []) as Array<Record<string, unknown>>;
		const hasMore = batch.length > limit;
		const page = hasMore ? batch.slice(0, limit) : batch;
		page.reverse();

		if (markRead) {
			await c.env.DB.prepare(
				`UPDATE conversations SET last_read_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
			)
				.bind(id)
				.run();
		}
		return c.json({ messages: page, hasMore });
	} catch (err) {
		console.error("Failed to list messages", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/conversations/:id/messages", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const content = typeof body.content === "string" ? body.content.trim() : "";
	if (!content) return c.json({ error: "Message can't be empty" }, 400);

	try {
		const conversation = await c.env.DB.prepare("SELECT id, title, scope FROM conversations WHERE id = ?")
			.bind(id)
			.first<{
				id: number;
				title: string;
				scope: string;
			}>();
		if (!conversation) return c.json({ error: "Conversation not found" }, 404);

		const userMessage = await c.env.DB.prepare(
			"INSERT INTO chat_messages (conversation_id, role, content) VALUES (?, 'user', ?) RETURNING id, role, content, suggested_memory, artifact, working, confidence, input_tokens, output_tokens, cost_usd, latency_ms, created_at",
		)
			.bind(id, content)
			.first();

		const reply = await generateAssistantReply(c.env, content);
		const usage = estimateReplyUsage(content, reply.content);

		const assistantMessage = await c.env.DB.prepare(
			"INSERT INTO chat_messages (conversation_id, role, content, suggested_memory, artifact, working, confidence, input_tokens, output_tokens, cost_usd, latency_ms) VALUES (?, 'assistant', ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, role, content, suggested_memory, artifact, working, confidence, input_tokens, output_tokens, cost_usd, latency_ms, created_at",
		)
			.bind(
				id,
				reply.content,
				reply.suggestedMemory,
				reply.artifact,
				JSON.stringify(reply.working),
				reply.confidence,
				usage.inputTokens,
				usage.outputTokens,
				usage.costUsd,
				usage.latencyMs,
			)
			.first();

		let title = conversation.title;
		if (title === "New chat") {
			title = content.length > 48 ? `${content.slice(0, 48)}…` : content;
			await c.env.DB.prepare("UPDATE conversations SET title = ? WHERE id = ?").bind(title, id).run();
		}
		await c.env.DB.prepare(
			`UPDATE conversations
			 SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
			     last_read_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE id = ?`,
		)
			.bind(id)
			.run();

		return c.json({ userMessage, assistantMessage, title });
	} catch (err) {
		console.error("Failed to post message", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

const TEAM_ROLES = new Set(["Admin", "Member"]);

function slugToName(email: string): string {
	return email
		.split("@")[0]
		.split(/[._-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

api.get("/team", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const rows = await c.env.DB.prepare("SELECT * FROM team_members ORDER BY is_you DESC, created_at ASC").all();
		return c.json({ members: rows.results });
	} catch (err) {
		console.error("Failed to list team members", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/team", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
	const role = typeof body.role === "string" && TEAM_ROLES.has(body.role) ? body.role : "Member";
	if (!email || !EMAIL_RE.test(email)) return c.json({ error: "Please enter a valid email address." }, 400);

	try {
		const existing = await c.env.DB.prepare("SELECT id FROM team_members WHERE email = ?").bind(email).first();
		if (existing) return c.json({ error: "That person is already on the team." }, 400);

		const member = await c.env.DB.prepare(
			"INSERT INTO team_members (name, email, role, status) VALUES (?, ?, ?, 'invited') RETURNING *",
		)
			.bind(slugToName(email), email, role)
			.first();
		return c.json({ member });
	} catch (err) {
		console.error("Failed to invite team member", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/team/:id", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const role = typeof body.role === "string" ? body.role : "";
	if (!TEAM_ROLES.has(role)) return c.json({ error: "Invalid role" }, 400);

	try {
		const existing = await c.env.DB.prepare("SELECT is_you, role FROM team_members WHERE id = ?").bind(id).first<{
			is_you: number;
			role: string;
		}>();
		if (!existing) return c.json({ error: "Team member not found" }, 404);
		if (existing.role === "Owner") return c.json({ error: "The workspace owner's role can't be changed." }, 400);

		const member = await c.env.DB.prepare("UPDATE team_members SET role = ? WHERE id = ? RETURNING *")
			.bind(role, id)
			.first();
		return c.json({ member });
	} catch (err) {
		console.error("Failed to update team member", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.delete("/team/:id", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	try {
		const existing = await c.env.DB.prepare("SELECT is_you, role FROM team_members WHERE id = ?").bind(id).first<{
			is_you: number;
			role: string;
		}>();
		if (!existing) return c.json({ error: "Team member not found" }, 404);
		if (existing.role === "Owner" || existing.is_you)
			return c.json({ error: "You can't remove the workspace owner." }, 400);

		await c.env.DB.prepare("DELETE FROM team_members WHERE id = ?").bind(id).run();
		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to remove team member", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

type PlanId = "starter" | "scale" | "enterprise";

const PLAN_CONFIG: Record<PlanId, { name: string; priceCents: number | null; seats: string; features: string[] }> = {
	starter: {
		name: "Starter",
		priceCents: 9900,
		seats: "Up to 3 seats",
		features: ["AI chat", "Memory library", "Email digests"],
	},
	scale: {
		name: "Scale",
		priceCents: 49900,
		seats: "Up to 10 seats",
		features: ["Everything in Starter", "Slack integration", "Proposed memory review"],
	},
	enterprise: {
		name: "Enterprise",
		priceCents: null,
		seats: "Unlimited seats",
		features: ["Everything in Scale", "SSO & audit logs", "Dedicated support"],
	},
};

type UsageMetricId = "messages" | "slackPosts" | "memories" | "seats";

const PLAN_QUOTAS: Record<PlanId, Record<UsageMetricId, number>> = {
	starter: { messages: 300, slackPosts: 0, memories: 50, seats: 3 },
	scale: { messages: 1000, slackPosts: 250, memories: 200, seats: 10 },
	enterprise: { messages: Infinity, slackPosts: Infinity, memories: Infinity, seats: Infinity },
};

const USAGE_RATES: Record<UsageMetricId, { label: string; unit: string; rateCents: number }> = {
	messages: { label: "AI chat messages", unit: "message", rateCents: 2 },
	slackPosts: { label: "Slack posts", unit: "post", rateCents: 5 },
	memories: { label: "Memories tracked", unit: "memory", rateCents: 10 },
	seats: { label: "Team seats", unit: "seat", rateCents: 1500 },
};

type BillingPlanRow = {
	plan_id: string;
	renews_at: string;
	card_brand: string;
	card_last4: string;
	card_exp: string;
	updated_at: string;
};

api.get("/billing", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const [planRow, invoicesResult, messagesCount, memoriesCount, seatsCount, usageCounters] = await Promise.all([
			c.env.DB.prepare("SELECT * FROM billing_plan WHERE id = 1").first<BillingPlanRow>(),
			c.env.DB.prepare(
				"SELECT id, invoice_date, description, amount_cents, status FROM billing_invoices ORDER BY invoice_date DESC",
			).all(),
			c.env.DB.prepare("SELECT COUNT(*) as n FROM chat_messages WHERE role = 'user'").first<{ n: number }>(),
			c.env.DB.prepare("SELECT COUNT(*) as n FROM memories").first<{ n: number }>(),
			c.env.DB.prepare("SELECT COUNT(*) as n FROM team_members").first<{ n: number }>(),
			c.env.DB.prepare("SELECT slack_posts FROM usage_counters WHERE id = 1").first<{ slack_posts: number }>(),
		]);

		const planId = (planRow?.plan_id as PlanId) ?? "scale";
		const plan = PLAN_CONFIG[planId] ?? PLAN_CONFIG.scale;
		const quotas = PLAN_QUOTAS[planId] ?? PLAN_QUOTAS.scale;

		const used: Record<UsageMetricId, number> = {
			messages: messagesCount?.n ?? 0,
			memories: memoriesCount?.n ?? 0,
			seats: seatsCount?.n ?? 0,
			slackPosts: usageCounters?.slack_posts ?? 0,
		};

		const usage = (Object.keys(USAGE_RATES) as UsageMetricId[]).map((id) => {
			const quota = quotas[id];
			const unlimited = !Number.isFinite(quota);
			const overage = unlimited ? 0 : Math.max(0, used[id] - quota);
			return {
				id,
				label: USAGE_RATES[id].label,
				unit: USAGE_RATES[id].unit,
				used: used[id],
				included: unlimited ? null : quota,
				overage,
				rateCents: USAGE_RATES[id].rateCents,
				costCents: overage * USAGE_RATES[id].rateCents,
			};
		});

		const usageCostCents = usage.reduce((sum, u) => sum + u.costCents, 0);

		return c.json({
			plan: {
				id: planId,
				name: plan.name,
				priceCents: plan.priceCents,
				seats: plan.seats,
				features: plan.features,
				renewsAt: planRow?.renews_at ?? null,
				card: planRow ? { brand: planRow.card_brand, last4: planRow.card_last4, exp: planRow.card_exp } : null,
			},
			plans: (Object.keys(PLAN_CONFIG) as PlanId[]).map((id) => ({ id, ...PLAN_CONFIG[id] })),
			usage,
			usageCostCents,
			estimatedTotalCents: plan.priceCents === null ? null : plan.priceCents + usageCostCents,
			invoices: invoicesResult.results,
		});
	} catch (err) {
		console.error("Failed to load billing", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/billing/plan", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const planId = typeof body.planId === "string" ? body.planId : "";
	if (!(planId in PLAN_CONFIG)) return c.json({ error: "Unknown plan" }, 400);

	try {
		await c.env.DB.prepare(
			"UPDATE billing_plan SET plan_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 1",
		)
			.bind(planId)
			.run();
		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to change plan", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.put("/billing/payment", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const last4 = typeof body.last4 === "string" ? body.last4.replace(/\D/g, "").slice(-4) : "";
	const exp = typeof body.exp === "string" ? body.exp.trim().slice(0, 10) : "";
	if (last4.length !== 4) return c.json({ error: "Enter a valid card number." }, 400);
	if (!exp) return c.json({ error: "Enter a valid expiry." }, 400);

	try {
		await c.env.DB.prepare(
			"UPDATE billing_plan SET card_last4 = ?, card_exp = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 1",
		)
			.bind(last4, exp)
			.run();
		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to update payment method", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

api.get("/support/tickets", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	try {
		const rows = await c.env.DB.prepare("SELECT * FROM support_tickets ORDER BY id DESC").all<{ status: string }>();
		const openCount = rows.results.filter((t) => t.status === "Open").length;
		return c.json({ tickets: rows.results, openCount });
	} catch (err) {
		console.error("Failed to list support tickets", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.post("/support/messages", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await readJson(c);
	if (!body) return c.json({ error: "Invalid request body" }, 400);

	const subject = typeof body.subject === "string" ? body.subject.trim() : "";
	const message = typeof body.message === "string" ? body.message.trim() : "";
	if (!subject || !message) return c.json({ error: "Please fill in a subject and message." }, 400);

	try {
		const ticket = await c.env.DB.prepare(
			"INSERT INTO support_tickets (subject, message, status) VALUES (?, ?, 'Open') RETURNING *",
		)
			.bind(subject, message)
			.first();
		return c.json({ ticket });
	} catch (err) {
		console.error("Failed to create support ticket", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

// ---------------------------------------------------------------------------
// Chat share links (short URLs)
// ---------------------------------------------------------------------------

const SHARE_CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

function makeShareCode(length = 8): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let out = "";
	for (const b of bytes) out += SHARE_CODE_ALPHABET[b % SHARE_CODE_ALPHABET.length];
	return out;
}

function sharePayload(row: {
	code: string;
	title: string;
	is_public: number;
	messages_json: string;
	created_by: string | null;
	created_at: string;
	conversation_id: number | null;
	fixture_id: string | null;
}) {
	let messages: unknown[] = [];
	try {
		const parsed = JSON.parse(row.messages_json);
		if (Array.isArray(parsed)) messages = parsed;
	} catch {
		messages = [];
	}
	return {
		code: row.code,
		title: row.title,
		isPublic: !!row.is_public,
		messages,
		createdBy: row.created_by,
		createdAt: row.created_at,
		conversationId: row.conversation_id,
		fixtureId: row.fixture_id,
		shortPath: `/s/${row.code}`,
	};
}

function serializeShareMessages(raw: unknown): string {
	if (!Array.isArray(raw)) return "[]";
	const cleaned = raw
		.map((m) => {
			if (!m || typeof m !== "object") return null;
			const msg = m as Record<string, unknown>;
			const role = msg.role === "assistant" ? "assistant" : msg.role === "user" ? "user" : null;
			const content = typeof msg.content === "string" ? msg.content : "";
			if (!role || !content) return null;
			return {
				id: typeof msg.id === "number" ? msg.id : undefined,
				role,
				content,
				suggested_memory: typeof msg.suggested_memory === "string" ? msg.suggested_memory : null,
				artifact: typeof msg.artifact === "string" ? msg.artifact : null,
				working: typeof msg.working === "string" ? msg.working : null,
				confidence: typeof msg.confidence === "number" ? msg.confidence : null,
				input_tokens: typeof msg.input_tokens === "number" ? msg.input_tokens : null,
				output_tokens: typeof msg.output_tokens === "number" ? msg.output_tokens : null,
				cost_usd: typeof msg.cost_usd === "number" ? msg.cost_usd : null,
				latency_ms: typeof msg.latency_ms === "number" ? msg.latency_ms : null,
				created_at: typeof msg.created_at === "string" ? msg.created_at : "",
			};
		})
		.filter(Boolean);
	return JSON.stringify(cleaned);
}

api.post("/chat-shares", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = (await readJson(c)) ?? {};
	const conversationId = typeof body.conversationId === "number" ? body.conversationId : null;
	const fixtureId = typeof body.fixtureId === "string" && body.fixtureId.trim() ? body.fixtureId.trim() : null;
	const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 160) : "Shared chat";
	const isPublic = body.isPublic === true;
	const messagesJson = serializeShareMessages(body.messages);
	const profile = await getProfileUser(c.env);

	if (!conversationId && !fixtureId) {
		return c.json({ error: "Provide a conversation or fixture to share" }, 400);
	}

	try {
		type ShareRow = {
			code: string;
			title: string;
			is_public: number;
			messages_json: string;
			created_by: string | null;
			created_at: string;
			conversation_id: number | null;
			fixture_id: string | null;
		};

		const existing = conversationId
			? await c.env.DB.prepare("SELECT * FROM chat_shares WHERE conversation_id = ? LIMIT 1")
					.bind(conversationId)
					.first<ShareRow>()
			: await c.env.DB.prepare("SELECT * FROM chat_shares WHERE fixture_id = ? LIMIT 1")
					.bind(fixtureId)
					.first<ShareRow>();

		if (existing) {
			await c.env.DB.prepare(
				`UPDATE chat_shares
				 SET title = ?, is_public = ?, messages_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
				 WHERE code = ?`,
			)
				.bind(title, isPublic ? 1 : 0, messagesJson, existing.code)
				.run();
			return c.json({
				share: sharePayload({
					...existing,
					title,
					is_public: isPublic ? 1 : 0,
					messages_json: messagesJson,
				}),
			});
		}

		let code = makeShareCode();
		for (let attempt = 0; attempt < 5; attempt++) {
			const clash = await c.env.DB.prepare("SELECT code FROM chat_shares WHERE code = ?").bind(code).first();
			if (!clash) break;
			code = makeShareCode();
		}

		const row = await c.env.DB.prepare(
			`INSERT INTO chat_shares (code, conversation_id, fixture_id, title, is_public, messages_json, created_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?)
			 RETURNING *`,
		)
			.bind(code, conversationId, fixtureId, title, isPublic ? 1 : 0, messagesJson, profile.name)
			.first<ShareRow>();

		if (!row) return c.json({ error: "Failed to create share link" }, 500);
		return c.json({ share: sharePayload(row) });
	} catch (err) {
		console.error("Failed to create chat share", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.patch("/chat-shares/:code", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const code = c.req.param("code");
	if (!code) return c.json({ error: "Invalid share code" }, 400);

	const body = (await readJson(c)) ?? {};
	try {
		type ShareRow = {
			code: string;
			title: string;
			is_public: number;
			messages_json: string;
			created_by: string | null;
			created_at: string;
			conversation_id: number | null;
			fixture_id: string | null;
		};

		const existing = await c.env.DB.prepare("SELECT * FROM chat_shares WHERE code = ?").bind(code).first<ShareRow>();
		if (!existing) return c.json({ error: "Share not found" }, 404);

		const isPublic = typeof body.isPublic === "boolean" ? body.isPublic : !!existing.is_public;
		const title =
			typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 160) : existing.title;
		const messagesJson = body.messages !== undefined ? serializeShareMessages(body.messages) : existing.messages_json;

		await c.env.DB.prepare(
			`UPDATE chat_shares
			 SET title = ?, is_public = ?, messages_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
			 WHERE code = ?`,
		)
			.bind(title, isPublic ? 1 : 0, messagesJson, code)
			.run();

		return c.json({
			share: sharePayload({
				...existing,
				title,
				is_public: isPublic ? 1 : 0,
				messages_json: messagesJson,
			}),
		});
	} catch (err) {
		console.error("Failed to update chat share", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

api.get("/chat-shares/:code", async (c) => {
	const code = c.req.param("code");
	if (!code) return c.json({ error: "Invalid share code" }, 400);

	try {
		type ShareRow = {
			code: string;
			title: string;
			is_public: number;
			messages_json: string;
			created_by: string | null;
			created_at: string;
			conversation_id: number | null;
			fixture_id: string | null;
		};

		const row = await c.env.DB.prepare("SELECT * FROM chat_shares WHERE code = ?").bind(code).first<ShareRow>();
		if (!row) return c.json({ error: "Share not found" }, 404);

		if (!row.is_public) {
			const session = await requireAppAuth(c);
			if (!session) return c.json({ error: "This share link is private. Sign in to view it." }, 401);
		}

		return c.json({ share: sharePayload(row) });
	} catch (err) {
		console.error("Failed to load chat share", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

export default api;
