-- Service uptime tracking for /status.
CREATE TABLE IF NOT EXISTS service_meta (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	online_since TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO service_meta (id) VALUES (1);

CREATE TABLE IF NOT EXISTS status_samples (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	ok INTEGER NOT NULL,
	latency_ms INTEGER,
	detail TEXT,
	checked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_status_samples_checked_at ON status_samples (checked_at);
