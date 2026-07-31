-- Demo Datadog connection for the /app Settings integrations.

CREATE TABLE IF NOT EXISTS datadog_settings (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	connected INTEGER NOT NULL DEFAULT 0,
	org_name TEXT,
	site TEXT NOT NULL DEFAULT 'datadoghq.com',
	default_service TEXT,
	sync_apm_errors INTEGER NOT NULL DEFAULT 1,
	sync_slo_breaches INTEGER NOT NULL DEFAULT 1,
	use_in_chat INTEGER NOT NULL DEFAULT 1,
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO datadog_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS datadog_services (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	env TEXT NOT NULL DEFAULT 'prod'
);

INSERT OR IGNORE INTO datadog_services (id, name, env) VALUES
	('S01WEB', 'beacon-web', 'prod'),
	('S02API', 'beacon-api', 'prod'),
	('S03WORKER', 'beacon-worker', 'prod'),
	('S04BILLING', 'beacon-billing', 'prod'),
	('S05INGEST', 'beacon-ingest', 'staging');
