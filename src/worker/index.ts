import { Hono } from "hono";
import { renderLandingPageHtml } from "./ssr";
import adminApi from "./admin-api";
import appApi from "./app-api";
import { buildStatusReport, recordScheduledStatusSample } from "./status";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/app", appApi);
app.route("/api/admin", adminApi);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL_PLACEHOLDER = "__SITE_URL__";
const APP_ROOT_PLACEHOLDER = '<div id="root"></div>';

// Internal Lumantic Slack workspace, #waitlist channel. Fine to keep hardcoded.
const WAITLIST_SLACK_CHANNEL_ID = "C0BM7M5GW2E";

/**
 * Pings the internal #waitlist Slack channel when someone registers interest.
 * Best-effort: failures are logged but never affect the registration response.
 */
async function notifyWaitlistSlackChannel(env: Env, email: string) {
	if (!env.LUMANTIC_SLACK_BOT_TOKEN) return;

	try {
		const res = await fetch("https://slack.com/api/chat.postMessage", {
			method: "POST",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				Authorization: `Bearer ${env.LUMANTIC_SLACK_BOT_TOKEN}`,
			},
			body: JSON.stringify({
				channel: WAITLIST_SLACK_CHANNEL_ID,
				text: `${email} was added to waitlist, you can view all in lumantic.ai/admin`,
			}),
		});
		const data = await res.json<{ ok: boolean; error?: string }>();
		if (!data.ok) {
			console.error("Slack waitlist notification rejected", data.error);
		}
	} catch (err) {
		console.error("Failed to notify Slack about new waitlist signup", err);
	}
}

/**
 * Server-renders the landing page into the built HTML shell so crawlers (and users)
 * get fully-formed markup on first byte, then React hydrates on the client.
 */
app.get("/", async (c) => {
	const assetResponse = await fetchHtmlShell(c);
	if (!assetResponse) {
		return c.text("Landing page unavailable", 503);
	}

	const template = await assetResponse.text();
	const siteUrl = new URL(c.req.url).origin;
	const appHtml = renderLandingPageHtml();

	const html = template
		.replaceAll(SITE_URL_PLACEHOLDER, siteUrl)
		.replace(APP_ROOT_PLACEHOLDER, `<div id="root">${appHtml}</div>`);

	return c.html(html);
});

/** Resolve the Vite/Pages HTML shell for SSR injection. */
async function fetchHtmlShell(c: { req: { url: string; raw: Request }; env: Env }) {
	const candidates = ["/", "/index.html", "/app"];
	for (const path of candidates) {
		const url = new URL(path, c.req.url);
		const res = await c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
		if (res.ok) {
			const clone = res.clone();
			const text = await clone.text();
			if (text.includes(APP_ROOT_PLACEHOLDER) || text.includes('id="root"')) {
				return res;
			}
		}
	}

	// Local Vite: ASSETS subrequests often skip SPA fallback. Fetch via the public origin instead.
	try {
		const res = await fetch(new URL("/app", c.req.url));
		if (res.ok) {
			const text = await res.clone().text();
			if (text.includes(APP_ROOT_PLACEHOLDER) || text.includes('id="root"')) {
				return res;
			}
		}
	} catch {
		/* ignore */
	}

	return null;
}

app.get("/robots.txt", (c) => {
	const siteUrl = new URL(c.req.url).origin;
	const body = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /admin",
		"Disallow: /api/",
		"",
		`Sitemap: ${siteUrl}/sitemap.xml`,
		"",
	].join("\n");
	return c.text(body, 200, { "Content-Type": "text/plain; charset=utf-8" });
});

app.get("/sitemap.xml", (c) => {
	const siteUrl = new URL(c.req.url).origin;
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${siteUrl}/</loc>
		<changefreq>weekly</changefreq>
		<priority>1.0</priority>
	</url>
	<url>
		<loc>${siteUrl}/status</loc>
		<changefreq>hourly</changefreq>
		<priority>0.6</priority>
	</url>
</urlset>
`;
	return c.text(body, 200, { "Content-Type": "application/xml; charset=utf-8" });
});

app.post("/api/register", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const email =
		typeof (body as { email?: unknown })?.email === "string"
			? (body as { email: string }).email.trim().toLowerCase()
			: "";

	if (!email || !EMAIL_RE.test(email)) {
		return c.json({ error: "Please enter a valid email address" }, 400);
	}

	try {
		await c.env.DB.prepare("INSERT INTO registrations (email) VALUES (?)").bind(email).run();
	} catch (err) {
		console.error("Failed to save registration", err);
		return c.json({ error: "Something went wrong. Please try again." }, 500);
	}

	c.executionCtx.waitUntil(notifyWaitlistSlackChannel(c.env, email));

	return c.json({ ok: true });
});

app.get("/api/site-banner", async (c) => {
	try {
		const row = await c.env.DB.prepare("SELECT enabled, message FROM site_banner WHERE id = 1").first<{
			enabled: number;
			message: string;
		}>();
		return c.json({
			enabled: Boolean(row?.enabled),
			message: row?.message ?? "",
		});
	} catch (err) {
		console.error("Failed to load site banner", err);
		return c.json({ enabled: false, message: "" });
	}
});

app.get("/api/status", async (c) => {
	try {
		const report = await buildStatusReport(c.env.DB, { record: true });
		const httpStatus = report.overall === "outage" ? 503 : 200;
		return c.json(report, httpStatus);
	} catch (err) {
		console.error("Failed to build status report", err);
		return c.json(
			{
				overall: "outage",
				checkedAt: new Date().toISOString(),
				onlineSince: null,
				uptime: { windowDays: 30, percent: null, sampleCount: 0, okCount: 0, days: [] },
				components: [
					{ id: "api", name: "API", status: "outage", latencyMs: null, detail: "Status check failed" },
				],
				notice: null,
			},
			503,
		);
	}
});

const worker = {
	fetch: app.fetch,
	async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(recordScheduledStatusSample(env));
	},
};

export default worker;
