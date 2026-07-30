import { Hono } from "hono";
import type { Context } from "hono";
import { renderLandingPageHtml } from "./ssr";

const app = new Hono<{ Bindings: Env }>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL_PLACEHOLDER = "__SITE_URL__";
const APP_ROOT_PLACEHOLDER = '<div id="root"></div>';

/**
 * Server-renders the landing page into the built HTML shell so crawlers (and users)
 * get fully-formed markup on first byte, then React hydrates on the client.
 */
app.get("/", async (c) => {
	const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
	if (!assetResponse.ok) return assetResponse;

	const template = await assetResponse.text();
	const siteUrl = new URL(c.req.url).origin;
	const appHtml = renderLandingPageHtml();

	const html = template.replaceAll(SITE_URL_PLACEHOLDER, siteUrl).replace(APP_ROOT_PLACEHOLDER, `<div id="root">${appHtml}</div>`);

	return c.html(html);
});

app.get("/robots.txt", (c) => {
	const siteUrl = new URL(c.req.url).origin;
	const body = ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /api/", "", `Sitemap: ${siteUrl}/sitemap.xml`, ""].join(
		"\n",
	);
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
</urlset>
`;
	return c.text(body, 200, { "Content-Type": "application/xml; charset=utf-8" });
});

function timingSafeEqual(a: string, b: string): boolean {
	const enc = new TextEncoder();
	const aBytes = enc.encode(a);
	const bBytes = enc.encode(b);
	if (aBytes.length !== bBytes.length) return false;
	let result = 0;
	for (let i = 0; i < aBytes.length; i++) {
		result |= aBytes[i] ^ bBytes[i];
	}
	return result === 0;
}

function requireAdmin(c: Context<{ Bindings: Env }>): boolean {
	const header = c.req.header("x-admin-password") ?? "";
	return Boolean(c.env.ADMIN_PASSWORD) && timingSafeEqual(header, c.env.ADMIN_PASSWORD);
}

app.post("/api/register", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const email = typeof (body as { email?: unknown })?.email === "string" ? (body as { email: string }).email.trim().toLowerCase() : "";

	if (!email || !EMAIL_RE.test(email)) {
		return c.json({ error: "Please enter a valid email address" }, 400);
	}

	try {
		await c.env.DB.prepare("INSERT INTO registrations (email) VALUES (?)").bind(email).run();
	} catch (err) {
		console.error("Failed to save registration", err);
		return c.json({ error: "Something went wrong. Please try again." }, 500);
	}

	return c.json({ ok: true });
});

app.post("/api/admin/login", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const password = typeof (body as { password?: unknown })?.password === "string" ? (body as { password: string }).password : "";

	if (!c.env.ADMIN_PASSWORD || !timingSafeEqual(password, c.env.ADMIN_PASSWORD)) {
		return c.json({ error: "Incorrect password" }, 401);
	}

	return c.json({ ok: true });
});

app.get("/api/admin/registrations", async (c) => {
	if (!requireAdmin(c)) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const url = new URL(c.req.url);
	const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
	const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? "20", 10) || 20));
	const sort = url.searchParams.get("sort") === "oldest" ? "ASC" : "DESC";
	const search = (url.searchParams.get("q") ?? "").trim().toLowerCase();

	const offset = (page - 1) * pageSize;

	try {
		const whereClause = search ? "WHERE email LIKE ?" : "";
		const bindings = search ? [`%${search}%`] : [];

		const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM registrations ${whereClause}`)
			.bind(...bindings)
			.first<{ total: number }>();

		const rows = await c.env.DB.prepare(
			`SELECT id, email, created_at FROM registrations ${whereClause} ORDER BY created_at ${sort}, id ${sort} LIMIT ? OFFSET ?`,
		)
			.bind(...bindings, pageSize, offset)
			.all();

		return c.json({
			rows: rows.results,
			total: countResult?.total ?? 0,
			page,
			pageSize,
		});
	} catch (err) {
		console.error("Failed to list registrations", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

export default app;
