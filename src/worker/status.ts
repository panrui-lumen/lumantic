export type StatusComponent = {
	id: string;
	name: string;
	status: "operational" | "degraded" | "outage";
	latencyMs: number | null;
	detail: string | null;
};

export type UptimeDay = {
	date: string;
	status: "operational" | "degraded" | "outage" | "none";
	sampleCount: number;
	okCount: number;
};

export type StatusReport = {
	overall: "operational" | "degraded" | "outage";
	checkedAt: string;
	onlineSince: string | null;
	uptime: {
		windowDays: number;
		percent: number | null;
		sampleCount: number;
		okCount: number;
		days: UptimeDay[];
	};
	components: StatusComponent[];
	notice: string | null;
};

function utcDayKey(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function buildEmptyUptimeDays(windowDays: number): UptimeDay[] {
	const days: UptimeDay[] = [];
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	for (let i = windowDays - 1; i >= 0; i--) {
		const day = new Date(today);
		day.setUTCDate(today.getUTCDate() - i);
		days.push({ date: utcDayKey(day), status: "none", sampleCount: 0, okCount: 0 });
	}
	return days;
}

async function loadUptimeDays(db: D1Database, windowDays: number): Promise<UptimeDay[]> {
	const days = buildEmptyUptimeDays(windowDays);
	const byDate = new Map(days.map((d) => [d.date, d]));

	const rows = await db
		.prepare(
			`SELECT substr(checked_at, 1, 10) AS day,
			        COUNT(*) AS total,
			        COALESCE(SUM(ok), 0) AS ok_count
			 FROM status_samples
			 WHERE checked_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)
			 GROUP BY substr(checked_at, 1, 10)`,
		)
		.bind(`-${windowDays} days`)
		.all<{ day: string; total: number; ok_count: number }>();

	for (const row of rows.results ?? []) {
		const entry = byDate.get(row.day);
		if (!entry) continue;
		const sampleCount = row.total ?? 0;
		const okCount = row.ok_count ?? 0;
		entry.sampleCount = sampleCount;
		entry.okCount = okCount;
		if (sampleCount <= 0) entry.status = "none";
		else if (okCount === sampleCount) entry.status = "operational";
		else if (okCount === 0) entry.status = "outage";
		else entry.status = "degraded";
	}

	return days;
}

async function probeDatabase(db: D1Database): Promise<{ ok: boolean; latencyMs: number; detail: string | null }> {
	const started = Date.now();
	try {
		const row = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
		const latencyMs = Date.now() - started;
		if (!row || row.ok !== 1) {
			return { ok: false, latencyMs, detail: "Unexpected database response" };
		}
		return { ok: true, latencyMs, detail: null };
	} catch (err) {
		return {
			ok: false,
			latencyMs: Date.now() - started,
			detail: err instanceof Error ? err.message : "Database check failed",
		};
	}
}

async function maybeRecordSample(db: D1Database, ok: boolean, latencyMs: number, detail: string | null) {
	try {
		const last = await db
			.prepare("SELECT checked_at FROM status_samples ORDER BY id DESC LIMIT 1")
			.first<{ checked_at: string }>();
		if (last?.checked_at) {
			const ageMs = Date.now() - new Date(last.checked_at.endsWith("Z") ? last.checked_at : `${last.checked_at}Z`).getTime();
			if (Number.isFinite(ageMs) && ageMs < 60_000) return;
		}
		await db
			.prepare("INSERT INTO status_samples (ok, latency_ms, detail) VALUES (?, ?, ?)")
			.bind(ok ? 1 : 0, latencyMs, detail)
			.run();
	} catch (err) {
		console.error("Failed to record status sample", err);
	}
}

export async function buildStatusReport(db: D1Database, opts?: { record?: boolean }): Promise<StatusReport> {
	const checkedAt = new Date().toISOString();
	const dbProbe = await probeDatabase(db);

	const components: StatusComponent[] = [
		{
			id: "api",
			name: "API",
			status: "operational",
			latencyMs: null,
			detail: null,
		},
		{
			id: "database",
			name: "Database",
			status: dbProbe.ok ? "operational" : "outage",
			latencyMs: dbProbe.latencyMs,
			detail: dbProbe.detail,
		},
		{
			id: "app",
			name: "App",
			status: dbProbe.ok ? "operational" : "degraded",
			latencyMs: null,
			detail: dbProbe.ok ? null : "App depends on the database",
		},
	];

	let notice: string | null = null;
	try {
		const row = await db.prepare("SELECT enabled, message FROM status_notice WHERE id = 1").first<{
			enabled: number;
			message: string;
		}>();
		if (row?.enabled && row.message.trim()) {
			notice = row.message.trim();
		}
	} catch {
		// status_notice may be missing on older DBs; ignore
	}

	const hasOutage = components.some((c) => c.status === "outage");
	const hasDegraded = components.some((c) => c.status === "degraded");
	const overall = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational";
	const allOk = !hasOutage;

	if (opts?.record !== false) {
		await maybeRecordSample(db, allOk, dbProbe.latencyMs, dbProbe.detail);
	}

	let onlineSince: string | null = null;
	let sampleCount = 0;
	let okCount = 0;
	const windowDays = 30;
	let days = buildEmptyUptimeDays(windowDays);

	try {
		const meta = await db.prepare("SELECT online_since FROM service_meta WHERE id = 1").first<{
			online_since: string;
		}>();
		onlineSince = meta?.online_since ?? null;

		const stats = await db
			.prepare(
				`SELECT COUNT(*) AS total, COALESCE(SUM(ok), 0) AS ok_count
				 FROM status_samples
				 WHERE checked_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
			)
			.bind(`-${windowDays} days`)
			.first<{ total: number; ok_count: number }>();
		sampleCount = stats?.total ?? 0;
		okCount = stats?.ok_count ?? 0;
		days = await loadUptimeDays(db, windowDays);
	} catch (err) {
		console.error("Failed to load uptime stats", err);
	}

	const percent = sampleCount > 0 ? Math.round((okCount / sampleCount) * 10000) / 100 : allOk ? 100 : 0;

	return {
		overall,
		checkedAt,
		onlineSince,
		uptime: {
			windowDays,
			percent,
			sampleCount,
			okCount,
			days,
		},
		components,
		notice,
	};
}

export async function recordScheduledStatusSample(env: Env) {
	await buildStatusReport(env.DB, { record: true });
}
