-- Status page notice (admin-authored message on /status).
CREATE TABLE IF NOT EXISTS status_notice (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	enabled INTEGER NOT NULL DEFAULT 0,
	message TEXT NOT NULL DEFAULT '',
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO status_notice (id, enabled, message) VALUES (1, 0, '');
