import { Hono } from "hono";
import type { Context } from "hono";
import {
	LIVE_WORKSPACE_ID,
	isWorkspaceBillingStatus,
	isWorkspaceMemberRole,
	isWorkspacePlanId,
	type WorkspaceBillingStatus,
	type WorkspacePlanId,
} from "../shared/workspaces";
import { clampPage, clampPageSize } from "../shared/pagination";
import {
	IMPERSONATION_SESSION_TTL_MS,
	createAppSessionToken,
} from "./app-session";

type EnvBindings = { Bindings: Env };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MEMBER_ROLES = new Set(["Owner", "Admin", "Member"]);

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

function requireAdmin(c: Context<EnvBindings>): boolean {
	const header = c.req.header("x-admin-password") ?? "";
	return Boolean(c.env.ADMIN_PASSWORD) && timingSafeEqual(header, c.env.ADMIN_PASSWORD);
}

function slugToName(email: string): string {
	const local = email.split("@")[0] ?? "User";
	return local
		.split(/[._-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

type WorkspaceRow = {
	id: number;
	name: string;
	slug: string;
	plan_id: string;
	billing_status: string;
	overdue_since: string | null;
	renews_at: string | null;
	seat_limit: number;
	mrr_cents: number;
	primary_contact_email: string | null;
	notes: string;
	is_live: number;
	created_at: string;
	updated_at: string;
	user_count?: number;
};

function mapWorkspace(row: WorkspaceRow) {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		planId: row.plan_id,
		billingStatus: row.billing_status,
		overdueSince: row.overdue_since,
		renewsAt: row.renews_at,
		seatLimit: row.seat_limit,
		mrrCents: row.mrr_cents,
		primaryContactEmail: row.primary_contact_email,
		notes: row.notes,
		isLive: Boolean(row.is_live),
		userCount: row.user_count ?? 0,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

async function recordAudit(
	env: Env,
	event: {
		action: string;
		summary: string;
		reason?: string | null;
		targetMemberId?: number | null;
		targetEmail?: string | null;
		targetWorkspaceId?: number | null;
		targetWorkspaceName?: string | null;
		meta?: Record<string, unknown>;
	},
) {
	try {
		await env.DB.prepare(
			`INSERT INTO admin_audit_events
			 (action, actor, reason, target_member_id, target_email, target_workspace_id, target_workspace_name, summary, meta_json)
			 VALUES (?, 'admin', ?, ?, ?, ?, ?, ?, ?)`,
		)
			.bind(
				event.action,
				event.reason?.trim() || null,
				event.targetMemberId ?? null,
				event.targetEmail ?? null,
				event.targetWorkspaceId ?? null,
				event.targetWorkspaceName ?? null,
				event.summary,
				JSON.stringify(event.meta ?? {}),
			)
			.run();
	} catch (err) {
		console.error("Failed to record admin audit event", err);
	}
}

const adminApi = new Hono<EnvBindings>();

adminApi.use("*", async (c, next) => {
	const path = c.req.path.replace(/\/+$/, "");
	if (c.req.method === "POST" && (path === "/login" || path.endsWith("/login"))) {
		await next();
		return;
	}
	if (!requireAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
	await next();
});

adminApi.post("/login", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const password =
		typeof (body as { password?: unknown })?.password === "string" ? (body as { password: string }).password : "";

	if (!c.env.ADMIN_PASSWORD || !timingSafeEqual(password, c.env.ADMIN_PASSWORD)) {
		return c.json({ error: "Incorrect password" }, 401);
	}

	return c.json({ ok: true });
});

adminApi.get("/site-banner", async (c) => {
	try {
		const row = await c.env.DB.prepare("SELECT enabled, message, updated_at FROM site_banner WHERE id = 1").first<{
			enabled: number;
			message: string;
			updated_at: string;
		}>();
		return c.json({
			enabled: Boolean(row?.enabled),
			message: row?.message ?? "",
			updatedAt: row?.updated_at ?? null,
		});
	} catch (err) {
		console.error("Failed to load admin site banner", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.put("/site-banner", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const enabled = Boolean((body as { enabled?: unknown })?.enabled);
	const message =
		typeof (body as { message?: unknown })?.message === "string"
			? (body as { message: string }).message.trim().slice(0, 500)
			: "";

	if (enabled && !message) {
		return c.json({ error: "Add banner text before turning it on." }, 400);
	}

	try {
		await c.env.DB.prepare(
			`UPDATE site_banner
			 SET enabled = ?, message = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
			 WHERE id = 1`,
		)
			.bind(enabled ? 1 : 0, message)
			.run();

		await recordAudit(c.env, {
			action: "site_banner.update",
			summary: enabled ? `Enabled site banner: ${message.slice(0, 80)}` : "Disabled site banner",
			meta: { enabled, message },
		});

		const row = await c.env.DB.prepare("SELECT enabled, message, updated_at FROM site_banner WHERE id = 1").first<{
			enabled: number;
			message: string;
			updated_at: string;
		}>();
		return c.json({
			enabled: Boolean(row?.enabled),
			message: row?.message ?? "",
			updatedAt: row?.updated_at ?? null,
		});
	} catch (err) {
		console.error("Failed to update site banner", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.get("/status-notice", async (c) => {
	try {
		const row = await c.env.DB.prepare("SELECT enabled, message, updated_at FROM status_notice WHERE id = 1").first<{
			enabled: number;
			message: string;
			updated_at: string;
		}>();
		return c.json({
			enabled: Boolean(row?.enabled),
			message: row?.message ?? "",
			updatedAt: row?.updated_at ?? null,
		});
	} catch (err) {
		console.error("Failed to load status notice", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.put("/status-notice", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const enabled = Boolean((body as { enabled?: unknown })?.enabled);
	const message =
		typeof (body as { message?: unknown })?.message === "string"
			? (body as { message: string }).message.trim().slice(0, 1000)
			: "";

	if (enabled && !message) {
		return c.json({ error: "Add a status message before turning it on." }, 400);
	}

	try {
		await c.env.DB.prepare(
			`UPDATE status_notice
			 SET enabled = ?, message = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
			 WHERE id = 1`,
		)
			.bind(enabled ? 1 : 0, message)
			.run();

		await recordAudit(c.env, {
			action: "status_notice.update",
			summary: enabled ? `Enabled status notice: ${message.slice(0, 80)}` : "Disabled status notice",
			meta: { enabled, message },
		});

		const row = await c.env.DB.prepare("SELECT enabled, message, updated_at FROM status_notice WHERE id = 1").first<{
			enabled: number;
			message: string;
			updated_at: string;
		}>();
		return c.json({
			enabled: Boolean(row?.enabled),
			message: row?.message ?? "",
			updatedAt: row?.updated_at ?? null,
		});
	} catch (err) {
		console.error("Failed to update status notice", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

function csvEscape(value: string): string {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replaceAll('"', '""')}"`;
	}
	return value;
}

adminApi.get("/registrations", async (c) => {
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

adminApi.get("/registrations/export", async (c) => {
	const url = new URL(c.req.url);
	const sort = url.searchParams.get("sort") === "oldest" ? "ASC" : "DESC";
	const search = (url.searchParams.get("q") ?? "").trim().toLowerCase();

	try {
		const whereClause = search ? "WHERE email LIKE ?" : "";
		const bindings = search ? [`%${search}%`] : [];

		const rows = await c.env.DB.prepare(
			`SELECT email, created_at FROM registrations ${whereClause} ORDER BY created_at ${sort}, id ${sort}`,
		)
			.bind(...bindings)
			.all<{ email: string; created_at: string }>();

		const lines = ["email,created_at"];
		for (const row of rows.results ?? []) {
			lines.push(`${csvEscape(row.email)},${csvEscape(row.created_at)}`);
		}
		const csv = lines.join("\r\n") + "\r\n";
		const date = new Date().toISOString().slice(0, 10);

		return c.text(csv, 200, {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="lumantic-registrations-${date}.csv"`,
		});
	} catch (err) {
		console.error("Failed to export registrations", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.delete("/registrations/:id", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id) || id < 1) return c.json({ error: "Invalid id" }, 400);

	try {
		const existing = await c.env.DB.prepare("SELECT id, email, created_at FROM registrations WHERE id = ?")
			.bind(id)
			.first<{ id: number; email: string; created_at: string }>();
		if (!existing) return c.json({ error: "Registration not found" }, 404);

		await c.env.DB.prepare("DELETE FROM registrations WHERE id = ?").bind(id).run();

		await recordAudit(c.env, {
			action: "waitlist.delete",
			summary: `Removed ${existing.email} from the waitlist`,
			targetEmail: existing.email,
			meta: { registrationId: existing.id, createdAt: existing.created_at },
		});

		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to delete registration", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.get("/overview", async (c) => {
	try {
		const [registrations, workspaces, overdue, openTickets, members] = await Promise.all([
			c.env.DB.prepare("SELECT COUNT(*) as n FROM registrations").first<{ n: number }>(),
			c.env.DB.prepare("SELECT COUNT(*) as n FROM workspaces").first<{ n: number }>(),
			c.env.DB.prepare("SELECT COUNT(*) as n FROM workspaces WHERE billing_status = 'overdue'").first<{
				n: number;
			}>(),
			c.env.DB.prepare("SELECT COUNT(*) as n FROM support_tickets WHERE status = 'Open'").first<{ n: number }>(),
			c.env.DB.prepare("SELECT COUNT(*) as n FROM team_members").first<{ n: number }>(),
		]);
		return c.json({
			registrations: registrations?.n ?? 0,
			workspaces: workspaces?.n ?? 0,
			overdueWorkspaces: overdue?.n ?? 0,
			openTickets: openTickets?.n ?? 0,
			users: members?.n ?? 0,
		});
	} catch (err) {
		console.error("Failed to load admin overview", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.get("/workspaces", async (c) => {
	const url = new URL(c.req.url);
	const search = (url.searchParams.get("q") ?? "").trim().toLowerCase();
	const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();
	const plan = (url.searchParams.get("plan") ?? "").trim().toLowerCase();

	const where: string[] = [];
	const bindings: (string | number)[] = [];
	if (search) {
		where.push("(LOWER(w.name) LIKE ? OR LOWER(w.slug) LIKE ? OR LOWER(COALESCE(w.primary_contact_email, '')) LIKE ?)");
		bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
	}
	if (status && isWorkspaceBillingStatus(status)) {
		where.push("w.billing_status = ?");
		bindings.push(status);
	}
	if (plan && isWorkspacePlanId(plan)) {
		where.push("w.plan_id = ?");
		bindings.push(plan);
	}
	const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

	try {
		const rows = await c.env.DB.prepare(
			`SELECT w.*,
			        (SELECT COUNT(*) FROM team_members m WHERE m.workspace_id = w.id) AS user_count
			 FROM workspaces w
			 ${whereSql}
			 ORDER BY w.is_live DESC, w.name COLLATE NOCASE ASC`,
		)
			.bind(...bindings)
			.all<WorkspaceRow>();

		return c.json({ workspaces: (rows.results ?? []).map(mapWorkspace) });
	} catch (err) {
		console.error("Failed to list workspaces", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.get("/workspaces/:id", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id) || id < 1) return c.json({ error: "Invalid id" }, 400);

	try {
		const row = await c.env.DB.prepare(
			`SELECT w.*,
			        (SELECT COUNT(*) FROM team_members m WHERE m.workspace_id = w.id) AS user_count
			 FROM workspaces w
			 WHERE w.id = ?`,
		)
			.bind(id)
			.first<WorkspaceRow>();
		if (!row) return c.json({ error: "Workspace not found" }, 404);

		const members = await c.env.DB.prepare(
			`SELECT id, name, email, role, status, is_you, last_active_at, created_at, workspace_id
			 FROM team_members
			 WHERE workspace_id = ?
			 ORDER BY CASE role WHEN 'Owner' THEN 0 WHEN 'Admin' THEN 1 ELSE 2 END, created_at ASC`,
		)
			.bind(id)
			.all();

		return c.json({
			workspace: mapWorkspace(row),
			members: members.results ?? [],
		});
	} catch (err) {
		console.error("Failed to load workspace", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.patch("/workspaces/:id", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id) || id < 1) return c.json({ error: "Invalid id" }, 400);

	let body: Record<string, unknown>;
	try {
		body = (await c.req.json()) as Record<string, unknown>;
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	try {
		const existing = await c.env.DB.prepare("SELECT * FROM workspaces WHERE id = ?").bind(id).first<WorkspaceRow>();
		if (!existing) return c.json({ error: "Workspace not found" }, 404);

		let planId: WorkspacePlanId = isWorkspacePlanId(existing.plan_id) ? existing.plan_id : "starter";
		if (typeof body.planId === "string") {
			if (!isWorkspacePlanId(body.planId)) return c.json({ error: "Invalid plan" }, 400);
			planId = body.planId;
		}

		let billingStatus: WorkspaceBillingStatus = isWorkspaceBillingStatus(existing.billing_status)
			? existing.billing_status
			: "active";
		if (typeof body.billingStatus === "string") {
			if (!isWorkspaceBillingStatus(body.billingStatus)) return c.json({ error: "Invalid billing status" }, 400);
			billingStatus = body.billingStatus;
		}

		let overdueSince = existing.overdue_since;
		if (billingStatus === "overdue") {
			if (typeof body.overdueSince === "string" && body.overdueSince.trim()) {
				overdueSince = body.overdueSince.trim();
			} else if (!overdueSince) {
				overdueSince = new Date().toISOString();
			}
		} else {
			overdueSince = null;
		}

		const renewsAt =
			typeof body.renewsAt === "string" ? body.renewsAt.trim() || null : existing.renews_at;
		const seatLimit =
			typeof body.seatLimit === "number" && Number.isFinite(body.seatLimit) && body.seatLimit > 0
				? Math.floor(body.seatLimit)
				: existing.seat_limit;
		const mrrCents =
			typeof body.mrrCents === "number" && Number.isFinite(body.mrrCents) && body.mrrCents >= 0
				? Math.floor(body.mrrCents)
				: existing.mrr_cents;
		const primaryContactEmail =
			typeof body.primaryContactEmail === "string"
				? body.primaryContactEmail.trim().toLowerCase() || null
				: existing.primary_contact_email;
		if (primaryContactEmail && !EMAIL_RE.test(primaryContactEmail)) {
			return c.json({ error: "Primary contact email is invalid." }, 400);
		}
		const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : existing.notes;

		await c.env.DB.prepare(
			`UPDATE workspaces
			 SET plan_id = ?, billing_status = ?, overdue_since = ?, renews_at = ?, seat_limit = ?,
			     mrr_cents = ?, primary_contact_email = ?, notes = ?,
			     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
			 WHERE id = ?`,
		)
			.bind(planId, billingStatus, overdueSince, renewsAt, seatLimit, mrrCents, primaryContactEmail, notes, id)
			.run();

		if (id === LIVE_WORKSPACE_ID) {
			await c.env.DB.prepare(
				`UPDATE billing_plan
				 SET plan_id = ?, renews_at = COALESCE(?, renews_at),
				     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
				 WHERE id = 1`,
			)
				.bind(planId, renewsAt)
				.run();
			await c.env.DB.prepare(
				`UPDATE user_profile SET company = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 1`,
			)
				.bind(existing.name)
				.run();
		}

		const row = await c.env.DB.prepare(
			`SELECT w.*,
			        (SELECT COUNT(*) FROM team_members m WHERE m.workspace_id = w.id) AS user_count
			 FROM workspaces w WHERE w.id = ?`,
		)
			.bind(id)
			.first<WorkspaceRow>();

		await recordAudit(c.env, {
			action: "workspace.update",
			summary: `Updated workspace ${existing.name}`,
			targetWorkspaceId: id,
			targetWorkspaceName: existing.name,
			meta: { planId, billingStatus, seatLimit, mrrCents },
		});

		return c.json({ workspace: mapWorkspace(row!) });
	} catch (err) {
		console.error("Failed to update workspace", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.delete("/workspaces/:id", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id) || id < 1) return c.json({ error: "Invalid id" }, 400);

	let body: Record<string, unknown>;
	try {
		body = (await c.req.json()) as Record<string, unknown>;
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";

	try {
		const existing = await c.env.DB.prepare("SELECT * FROM workspaces WHERE id = ?").bind(id).first<WorkspaceRow>();
		if (!existing) return c.json({ error: "Customer not found" }, 404);
		if (existing.is_live || existing.id === LIVE_WORKSPACE_ID) {
			return c.json({ error: "The live Beacon customer that powers /app can't be deleted." }, 400);
		}
		if (!confirmation || confirmation !== existing.name) {
			return c.json({ error: `Type "${existing.name}" exactly to confirm.` }, 400);
		}

		await c.env.DB.prepare("DELETE FROM team_members WHERE workspace_id = ?").bind(id).run();
		await c.env.DB.prepare("DELETE FROM workspaces WHERE id = ?").bind(id).run();

		await recordAudit(c.env, {
			action: "customer.delete",
			summary: `Deleted customer ${existing.name}`,
			targetWorkspaceId: id,
			targetWorkspaceName: existing.name,
			meta: {
				slug: existing.slug,
				planId: existing.plan_id,
				billingStatus: existing.billing_status,
			},
		});

		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to delete customer", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.post("/workspaces/:id/members", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id) || id < 1) return c.json({ error: "Invalid id" }, 400);

	let body: Record<string, unknown>;
	try {
		body = (await c.req.json()) as Record<string, unknown>;
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
	const name =
		typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : slugToName(email);
	const role = typeof body.role === "string" && MEMBER_ROLES.has(body.role) ? body.role : "Member";
	if (!email || !EMAIL_RE.test(email)) return c.json({ error: "Please enter a valid email address." }, 400);

	try {
		const workspace = await c.env.DB.prepare("SELECT id, name FROM workspaces WHERE id = ?")
			.bind(id)
			.first<{ id: number; name: string }>();
		if (!workspace) return c.json({ error: "Workspace not found" }, 404);

		const existing = await c.env.DB.prepare("SELECT id FROM team_members WHERE email = ?").bind(email).first();
		if (existing) return c.json({ error: "That email is already on a workspace." }, 400);

		const member = await c.env.DB.prepare(
			`INSERT INTO team_members (workspace_id, name, email, role, status, is_you)
			 VALUES (?, ?, ?, ?, 'invited', 0)
			 RETURNING id, name, email, role, status, is_you, last_active_at, created_at, workspace_id`,
		)
			.bind(id, name, email, role)
			.first<{
				id: number;
				name: string;
				email: string;
				role: string;
				status: string;
				is_you: number;
				last_active_at: string | null;
				created_at: string;
				workspace_id: number;
			}>();

		await recordAudit(c.env, {
			action: "member.add",
			summary: `Added ${email} to ${workspace.name} as ${role}`,
			targetMemberId: member?.id ?? null,
			targetEmail: email,
			targetWorkspaceId: id,
			targetWorkspaceName: workspace.name,
			meta: { role },
		});

		return c.json({ member });
	} catch (err) {
		console.error("Failed to add workspace member", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.patch("/workspaces/:workspaceId/members/:memberId", async (c) => {
	const workspaceId = Number(c.req.param("workspaceId"));
	const memberId = Number(c.req.param("memberId"));
	if (!Number.isInteger(workspaceId) || !Number.isInteger(memberId)) {
		return c.json({ error: "Invalid id" }, 400);
	}

	let body: Record<string, unknown>;
	try {
		body = (await c.req.json()) as Record<string, unknown>;
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	try {
		const existing = await c.env.DB.prepare(
			"SELECT id, role, is_you FROM team_members WHERE id = ? AND workspace_id = ?",
		)
			.bind(memberId, workspaceId)
			.first<{ id: number; role: string; is_you: number }>();
		if (!existing) return c.json({ error: "Member not found" }, 404);

		let role = existing.role;
		if (typeof body.role === "string") {
			if (!isWorkspaceMemberRole(body.role)) return c.json({ error: "Invalid role" }, 400);
			if (existing.role === "Owner" && body.role !== "Owner") {
				return c.json({ error: "The workspace owner's role can't be changed." }, 400);
			}
			role = body.role;
		}

		let status = typeof body.status === "string" ? body.status : null;
		if (status != null && !["active", "invited", "disabled"].includes(status)) {
			return c.json({ error: "Invalid status" }, 400);
		}

		const member = await c.env.DB.prepare(
			`UPDATE team_members
			 SET role = ?, status = COALESCE(?, status)
			 WHERE id = ? AND workspace_id = ?
			 RETURNING id, name, email, role, status, is_you, last_active_at, created_at, workspace_id`,
		)
			.bind(role, status, memberId, workspaceId)
			.first<{
				id: number;
				name: string;
				email: string;
				role: string;
				status: string;
				is_you: number;
				last_active_at: string | null;
				created_at: string;
				workspace_id: number;
			}>();

		const workspace = await c.env.DB.prepare("SELECT name FROM workspaces WHERE id = ?")
			.bind(workspaceId)
			.first<{ name: string }>();

		await recordAudit(c.env, {
			action: "member.update",
			summary: `Updated ${member?.email ?? `member #${memberId}`} on ${workspace?.name ?? `workspace #${workspaceId}`}`,
			targetMemberId: memberId,
			targetEmail: member?.email ?? null,
			targetWorkspaceId: workspaceId,
			targetWorkspaceName: workspace?.name ?? null,
			meta: { role, status },
		});

		return c.json({ member });
	} catch (err) {
		console.error("Failed to update workspace member", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.delete("/workspaces/:workspaceId/members/:memberId", async (c) => {
	const workspaceId = Number(c.req.param("workspaceId"));
	const memberId = Number(c.req.param("memberId"));
	if (!Number.isInteger(workspaceId) || !Number.isInteger(memberId)) {
		return c.json({ error: "Invalid id" }, 400);
	}

	try {
		const existing = await c.env.DB.prepare(
			"SELECT role, is_you, email, name FROM team_members WHERE id = ? AND workspace_id = ?",
		)
			.bind(memberId, workspaceId)
			.first<{ role: string; is_you: number; email: string; name: string }>();
		if (!existing) return c.json({ error: "Member not found" }, 404);
		if (existing.role === "Owner" || existing.is_you) {
			return c.json({ error: "You can't remove the workspace owner." }, 400);
		}

		const workspace = await c.env.DB.prepare("SELECT name FROM workspaces WHERE id = ?")
			.bind(workspaceId)
			.first<{ name: string }>();

		await c.env.DB.prepare("DELETE FROM team_members WHERE id = ? AND workspace_id = ?")
			.bind(memberId, workspaceId)
			.run();

		await recordAudit(c.env, {
			action: "member.remove",
			summary: `Removed ${existing.email} from ${workspace?.name ?? `workspace #${workspaceId}`}`,
			targetMemberId: memberId,
			targetEmail: existing.email,
			targetWorkspaceId: workspaceId,
			targetWorkspaceName: workspace?.name ?? null,
		});

		return c.json({ ok: true });
	} catch (err) {
		console.error("Failed to remove workspace member", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.get("/employees", async (c) => {
	try {
		const rows = await c.env.DB.prepare(
			`SELECT id, name, created_at as createdAt
			 FROM admin_employees
			 ORDER BY name COLLATE NOCASE ASC`,
		).all();
		return c.json({ employees: rows.results ?? [] });
	} catch (err) {
		console.error("Failed to list employees", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.get("/support-tickets", async (c) => {
	try {
		const rows = await c.env.DB.prepare(
			`SELECT t.id, t.subject, t.message, t.status, t.created_at,
			        t.owner_employee_id AS ownerEmployeeId,
			        e.name AS ownerName
			 FROM support_tickets t
			 LEFT JOIN admin_employees e ON e.id = t.owner_employee_id
			 ORDER BY CASE t.status WHEN 'Open' THEN 0 ELSE 1 END, t.created_at DESC`,
		).all();
		return c.json({ tickets: rows.results ?? [] });
	} catch (err) {
		console.error("Failed to list support tickets", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.patch("/support-tickets/:id", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

	let body: Record<string, unknown>;
	try {
		body = (await c.req.json()) as Record<string, unknown>;
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const hasStatus = typeof body.status === "string";
	const hasOwner = "ownerEmployeeId" in body;
	if (!hasStatus && !hasOwner) {
		return c.json({ error: "Provide status and/or ownerEmployeeId." }, 400);
	}

	const status = hasStatus ? body.status : undefined;
	if (hasStatus && status !== "Open" && status !== "Resolved") {
		return c.json({ error: "Status must be Open or Resolved." }, 400);
	}

	let ownerEmployeeId: number | null | undefined;
	if (hasOwner) {
		if (body.ownerEmployeeId === null || body.ownerEmployeeId === "") {
			ownerEmployeeId = null;
		} else {
			const n = Number(body.ownerEmployeeId);
			if (!Number.isInteger(n) || n < 1) {
				return c.json({ error: "Invalid owner." }, 400);
			}
			ownerEmployeeId = n;
		}
	}

	try {
		const existing = await c.env.DB.prepare("SELECT id, subject, status, owner_employee_id FROM support_tickets WHERE id = ?")
			.bind(id)
			.first<{ id: number; subject: string; status: string; owner_employee_id: number | null }>();
		if (!existing) return c.json({ error: "Ticket not found" }, 404);

		const nextStatus = typeof status === "string" ? status : existing.status;
		let nextOwner = existing.owner_employee_id;
		let ownerName: string | null = null;

		if (ownerEmployeeId !== undefined) {
			if (ownerEmployeeId === null) {
				nextOwner = null;
			} else {
				const emp = await c.env.DB.prepare("SELECT id, name FROM admin_employees WHERE id = ?")
					.bind(ownerEmployeeId)
					.first<{ id: number; name: string }>();
				if (!emp) return c.json({ error: "Employee not found." }, 400);
				nextOwner = emp.id;
				ownerName = emp.name;
			}
		} else if (existing.owner_employee_id != null) {
			const emp = await c.env.DB.prepare("SELECT name FROM admin_employees WHERE id = ?")
				.bind(existing.owner_employee_id)
				.first<{ name: string }>();
			ownerName = emp?.name ?? null;
		}

		const ticket = await c.env.DB.prepare(
			`UPDATE support_tickets SET status = ?, owner_employee_id = ? WHERE id = ?
			 RETURNING id, subject, message, status, created_at, owner_employee_id AS ownerEmployeeId`,
		)
			.bind(nextStatus, nextOwner, id)
			.first<{
				id: number;
				subject: string;
				message: string;
				status: string;
				created_at: string;
				ownerEmployeeId: number | null;
			}>();
		if (!ticket) return c.json({ error: "Ticket not found" }, 404);

		const changes: string[] = [];
		if (hasStatus && nextStatus !== existing.status) changes.push(`status to ${nextStatus}`);
		if (ownerEmployeeId !== undefined && nextOwner !== existing.owner_employee_id) {
			changes.push(ownerName ? `owner to ${ownerName}` : "owner cleared");
		}

		if (changes.length > 0) {
			await recordAudit(c.env, {
				action: "support_ticket.update",
				summary: `Updated support ticket #${id}: ${changes.join(", ")}`,
				meta: {
					ticketId: id,
					status: nextStatus,
					ownerEmployeeId: nextOwner,
					ownerName,
					subject: ticket.subject,
				},
			});
		}

		return c.json({
			ticket: {
				...ticket,
				ownerName,
			},
		});
	} catch (err) {
		console.error("Failed to update support ticket", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.post("/impersonate", async (c) => {
	let body: Record<string, unknown>;
	try {
		body = (await c.req.json()) as Record<string, unknown>;
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	const memberId = typeof body.memberId === "number" ? body.memberId : Number(body.memberId);
	const reason = typeof body.reason === "string" ? body.reason.trim() : "";
	if (!Number.isInteger(memberId) || memberId < 1) {
		return c.json({ error: "Pick a user to log in as." }, 400);
	}
	if (reason.length < 8) {
		return c.json({ error: "Enter a reason (at least 8 characters). This is stored for internal audit." }, 400);
	}
	if (reason.length > 500) {
		return c.json({ error: "Reason is too long." }, 400);
	}

	try {
		const member = await c.env.DB.prepare(
			`SELECT m.id, m.name, m.email, m.role, m.status, m.workspace_id, w.name AS workspace_name
			 FROM team_members m
			 JOIN workspaces w ON w.id = m.workspace_id
			 WHERE m.id = ?`,
		)
			.bind(memberId)
			.first<{
				id: number;
				name: string;
				email: string;
				role: string;
				status: string;
				workspace_id: number;
				workspace_name: string;
			}>();
		if (!member) return c.json({ error: "User not found" }, 404);
		if (member.status === "disabled") {
			return c.json({ error: "That user is disabled." }, 400);
		}

		const token = await createAppSessionToken({
			username: member.email,
			memberId: member.id,
			impersonating: true,
			ttlMs: IMPERSONATION_SESSION_TTL_MS,
		});

		await recordAudit(c.env, {
			action: "impersonate.start",
			summary: `Logged in as ${member.email} (${member.workspace_name})`,
			reason,
			targetMemberId: member.id,
			targetEmail: member.email,
			targetWorkspaceId: member.workspace_id,
			targetWorkspaceName: member.workspace_name,
			meta: { role: member.role, name: member.name },
		});

		return c.json({
			ok: true,
			token,
			user: {
				username: member.email,
				name: member.name,
				role: member.role,
				company: member.workspace_name,
				workspaceRole: member.role,
				impersonating: true,
			},
		});
	} catch (err) {
		console.error("Failed to impersonate user", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

adminApi.get("/audit", async (c) => {
	const page = clampPage(Number(c.req.query("page") ?? 1));
	const pageSize = clampPageSize(Number(c.req.query("pageSize") ?? 20), 20, 50);
	const q = (c.req.query("q") ?? "").trim().toLowerCase();
	const offset = (page - 1) * pageSize;

	try {
		const where = q
			? `WHERE lower(summary) LIKE ? OR lower(COALESCE(reason, '')) LIKE ? OR lower(COALESCE(target_email, '')) LIKE ? OR lower(action) LIKE ? OR lower(COALESCE(target_workspace_name, '')) LIKE ?`
			: "";
		const like = `%${q}%`;
		const binds = q ? [like, like, like, like, like] : [];

		const totalRow = await c.env.DB.prepare(`SELECT COUNT(*) as n FROM admin_audit_events ${where}`)
			.bind(...binds)
			.first<{ n: number }>();

		const rows = await c.env.DB.prepare(
			`SELECT id, created_at, action, actor, reason, target_member_id, target_email,
			        target_workspace_id, target_workspace_name, summary, meta_json
			 FROM admin_audit_events
			 ${where}
			 ORDER BY created_at DESC, id DESC
			 LIMIT ? OFFSET ?`,
		)
			.bind(...binds, pageSize, offset)
			.all<{
				id: number;
				created_at: string;
				action: string;
				actor: string;
				reason: string | null;
				target_member_id: number | null;
				target_email: string | null;
				target_workspace_id: number | null;
				target_workspace_name: string | null;
				summary: string;
				meta_json: string;
			}>();

		return c.json({
			rows: (rows.results ?? []).map((row) => ({
				id: row.id,
				createdAt: row.created_at,
				action: row.action,
				actor: row.actor,
				reason: row.reason,
				targetMemberId: row.target_member_id,
				targetEmail: row.target_email,
				targetWorkspaceId: row.target_workspace_id,
				targetWorkspaceName: row.target_workspace_name,
				summary: row.summary,
				meta: (() => {
					try {
						return JSON.parse(row.meta_json || "{}") as Record<string, unknown>;
					} catch {
						return {};
					}
				})(),
			})),
			total: totalRow?.n ?? 0,
			page,
			pageSize,
		});
	} catch (err) {
		console.error("Failed to list admin audit", err);
		return c.json({ error: "Something went wrong" }, 500);
	}
});

export default adminApi;
