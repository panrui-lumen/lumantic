import { Hono } from "hono";
import type { Context } from "hono";
import {
	genericWorking,
	matchBeaconAnalyticsQuestion,
	memoryLookupWorking,
	type ChatWorking,
} from "../shared/beacon-analytics";

/**
 * API for the /app product experience: a fake (demo-only) login, Slack
 * integration settings, AI memories + proposed memories, and a simulated
 * chat with the Lumantic AI analyst. None of this talks to a real LLM or a
 * real Slack workspace — it's wired up so the product feels real end to end.
 */
const api = new Hono<{ Bindings: Env }>();

const DEMO_USERNAME = "test@example.com";
const DEMO_PASSWORD = "3F*PVVkB8dkIImwipIBVp0Z$";
const DEMO_USER = {
	username: "test@example.com",
	name: "Avery Chen",
	role: "Head of Data",
	company: "Beacon",
};

// Demo-only signing secret for session tokens. This gate exists purely to
// simulate a real login flow — it is not meant to protect real data.
const SESSION_SECRET = "lumantic-app-demo-secret-v1";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generic English words that are too common to be useful signals when
// matching a chat message against the memory bank below.
const GENERIC_WORDS = new Set([
	"the", "and", "for", "are", "but", "not", "you", "your", "with", "have", "has", "had", "this", "that", "these", "those",
	"what", "when", "where", "which", "while", "who", "will", "would", "could", "should", "about", "above", "after", "again",
	"all", "also", "always", "any", "because", "been", "before", "being", "between", "both", "can", "did", "does", "doing",
	"down", "during", "each", "few", "from", "further", "how", "into", "its", "itself", "just", "like", "more", "most",
	"need", "now", "off", "once", "only", "other", "our", "ours", "out", "over", "own", "really", "right", "same", "some",
	"such", "tell", "than", "then", "there", "they", "them", "through", "too", "under", "until", "very", "was", "way",
	"well", "were", "yes", "report", "reports",
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
	const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
	const binary = atob(padded);
	return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
	return crypto.subtle.importKey("raw", new TextEncoder().encode(SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, [
		"sign",
		"verify",
	]);
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
		const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(sigB64) as BufferSource, new TextEncoder().encode(payloadB64));
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

type ProfileRow = { name: string; role: string; company: string };

async function getProfileUser(env: Env): Promise<typeof DEMO_USER> {
	try {
		const row = await env.DB.prepare("SELECT name, role, company FROM user_profile WHERE id = 1").first<ProfileRow>();
		if (!row) return DEMO_USER;
		return { username: DEMO_USERNAME, name: row.name, role: row.role, company: row.company };
	} catch (err) {
		// Local miniflare can briefly lose the D1 handle after migrations or a
		// stale long-lived vite process; never fail login because of that.
		console.error("getProfileUser failed, falling back to demo user", err);
		return DEMO_USER;
	}
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
		message: "Thanks! Lumantic is invite-only during our private beta, so new accounts are provisioned by the team. We'll be in touch.",
	});
});

api.get("/session", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);
	return c.json({ user: await getProfileUser(c.env) });
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

	await c.env.DB.prepare(
		"UPDATE user_profile SET name = ?, role = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 1",
	)
		.bind(name, role)
		.run();

	return c.json({ user: await getProfileUser(c.env) });
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
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

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
			const chan = await c.env.DB.prepare("SELECT name FROM slack_channels WHERE id = ?").bind(defaultChannelId).first<{ name: string }>();
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
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

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
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

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
			const chan = await c.env.DB.prepare("SELECT name FROM slack_channels WHERE id = ?").bind(body.defaultChannelId).first<{
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
		const result = await c.env.DB.prepare("INSERT INTO memories (content, category, source) VALUES (?, ?, ?) RETURNING *")
			.bind(content, category, source)
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
		const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : proposed.category;

		const memory = await c.env.DB.prepare("INSERT INTO memories (content, category, source) VALUES (?, ?, ?) RETURNING *")
			.bind(content, category, proposed.source)
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
): Promise<{ content: string; suggestedMemory: string | null; artifact: string | null; working: ChatWorking }> {
	const text = userText.trim();
	const lower = text.toLowerCase();

	const analytics = matchBeaconAnalyticsQuestion(text);
	if (analytics) {
		return {
			content: analytics.content,
			suggestedMemory: analytics.suggestedMemory,
			artifact: analytics.artifact ? JSON.stringify(analytics.artifact) : null,
			working: analytics.working,
		};
	}

	if (lower.length < 3 || /^(hi|hello|hey|yo|sup)\b/.test(lower)) {
		return {
			content:
				"Hey — I'm Lumantic for the **Beacon** data team. Ask about Beacon signups, sessions, crashes, or any metric definition we've confirmed, and I'll pull charts and tables when I can.",
			suggestedMemory: null,
			artifact: null,
			working: genericWorking("greeting"),
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
			};
		}
		return {
			content:
				"Slack isn't connected yet. Head to Settings → Slack integration to connect your workspace and pick a channel, and I'll start posting memories and digests there.",
			suggestedMemory: null,
			artifact: null,
			working: genericWorking("slack"),
		};
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
		};
	}

	try {
		const memories = await env.DB.prepare("SELECT content FROM memories ORDER BY created_at DESC").all<{ content: string }>();
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
			return {
				content: `Here's what I have on record for Beacon:\n\n> ${best.content}`,
				suggestedMemory: null,
				artifact: null,
				working: memoryLookupWorking(best.content),
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
	};
}

api.get("/conversations", async (c) => {
	const session = await requireAppAuth(c);
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const scope = c.req.query("scope") === "global" ? "global" : "personal";

	try {
		const rows = await c.env.DB.prepare(
			`SELECT id, title, scope, author_name, pinned, archived, created_at, updated_at
			 FROM conversations
			 WHERE scope = ?
			 ORDER BY pinned DESC, updated_at DESC`,
		)
			.bind(scope)
			.all();
		return c.json({ conversations: rows.results });
	} catch (err) {
		console.error("Failed to list conversations", err);
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
			`INSERT INTO conversations (title, scope, author_name)
			 VALUES ('New chat', ?, ?)
			 RETURNING id, title, scope, author_name, pinned, archived, created_at, updated_at`,
		)
			.bind(scope, authorName)
			.first();
		return c.json({ conversation });
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
			`INSERT INTO conversations (title, scope, author_name)
			 VALUES (?, ?, ?)
			 RETURNING id, title, scope, author_name, pinned, archived, created_at, updated_at`,
		)
			.bind(title, scope, authorName)
			.first<{ id: number }>();

		if (!conversation) return c.json({ error: "Failed to create conversation" }, 500);

		for (const raw of messages) {
			if (!raw || typeof raw !== "object") continue;
			const role = raw.role === "assistant" ? "assistant" : raw.role === "user" ? "user" : null;
			const content = typeof raw.content === "string" ? raw.content : "";
			if (!role || !content) continue;
			const suggested = typeof raw.suggested_memory === "string" ? raw.suggested_memory : null;
			const artifact = typeof raw.artifact === "string" ? raw.artifact : null;
			const working = typeof raw.working === "string" ? raw.working : null;
			await c.env.DB.prepare(
				`INSERT INTO chat_messages (conversation_id, role, content, suggested_memory, artifact, working)
				 VALUES (?, ?, ?, ?, ?, ?)`,
			)
				.bind(conversation.id, role, content, suggested, artifact, working)
				.run();
		}

		const full = await c.env.DB.prepare(
			`SELECT id, title, scope, author_name, pinned, archived, created_at, updated_at FROM conversations WHERE id = ?`,
		)
			.bind(conversation.id)
			.first();
		return c.json({ conversation: full });
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
			`SELECT id, title, scope, author_name, pinned, archived, created_at, updated_at FROM conversations WHERE id = ?`,
		)
			.bind(id)
			.first();
		return c.json({ conversation });
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
		const conversation = await c.env.DB.prepare("SELECT scope FROM conversations WHERE id = ?").bind(id).first<{ scope: string }>();
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

	try {
		const rows = await c.env.DB.prepare(
			"SELECT id, role, content, suggested_memory, artifact, working, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC",
		)
			.bind(id)
			.all();
		return c.json({ messages: rows.results });
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
		const conversation = await c.env.DB.prepare("SELECT id, title, scope FROM conversations WHERE id = ?").bind(id).first<{
			id: number;
			title: string;
			scope: string;
		}>();
		if (!conversation) return c.json({ error: "Conversation not found" }, 404);

		const userMessage = await c.env.DB.prepare(
			"INSERT INTO chat_messages (conversation_id, role, content) VALUES (?, 'user', ?) RETURNING id, role, content, suggested_memory, artifact, working, created_at",
		)
			.bind(id, content)
			.first();

		const reply = await generateAssistantReply(c.env, content);

		const assistantMessage = await c.env.DB.prepare(
			"INSERT INTO chat_messages (conversation_id, role, content, suggested_memory, artifact, working) VALUES (?, 'assistant', ?, ?, ?, ?) RETURNING id, role, content, suggested_memory, artifact, working, created_at",
		)
			.bind(id, reply.content, reply.suggestedMemory, reply.artifact, JSON.stringify(reply.working))
			.first();

		let title = conversation.title;
		if (title === "New chat") {
			title = content.length > 48 ? `${content.slice(0, 48)}…` : content;
			await c.env.DB.prepare("UPDATE conversations SET title = ? WHERE id = ?").bind(title, id).run();
		}
		await c.env.DB.prepare("UPDATE conversations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").bind(id).run();

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

		const member = await c.env.DB.prepare("UPDATE team_members SET role = ? WHERE id = ? RETURNING *").bind(role, id).first();
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
		if (existing.role === "Owner" || existing.is_you) return c.json({ error: "You can't remove the workspace owner." }, 400);

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
	starter: { name: "Starter", priceCents: 9900, seats: "Up to 3 seats", features: ["AI chat", "Memory library", "Email digests"] },
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
			c.env.DB.prepare("SELECT id, invoice_date, description, amount_cents, status FROM billing_invoices ORDER BY invoice_date DESC").all(),
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
		await c.env.DB.prepare("UPDATE billing_plan SET plan_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 1")
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

export default api;
