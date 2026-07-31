CREATE TABLE IF NOT EXISTS admin_audit_events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	action TEXT NOT NULL,
	actor TEXT NOT NULL DEFAULT 'admin',
	reason TEXT,
	target_member_id INTEGER,
	target_email TEXT,
	target_workspace_id INTEGER,
	target_workspace_name TEXT,
	summary TEXT NOT NULL,
	meta_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_events (action);
