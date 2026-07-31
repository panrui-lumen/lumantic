-- Multi-workspace catalog for platform admin. Beacon (id = 1) is the live
-- /app demo tenant. Other rows are seeded customers for admin tooling.
-- team_members gain workspace_id so admins can manage users per workspace.

CREATE TABLE IF NOT EXISTS workspaces (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	plan_id TEXT NOT NULL DEFAULT 'starter',
	billing_status TEXT NOT NULL DEFAULT 'active',
	overdue_since TEXT,
	renews_at TEXT,
	seat_limit INTEGER NOT NULL DEFAULT 5,
	mrr_cents INTEGER NOT NULL DEFAULT 0,
	primary_contact_email TEXT,
	notes TEXT NOT NULL DEFAULT '',
	is_live INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO workspaces (
	id, name, slug, plan_id, billing_status, overdue_since, renews_at,
	seat_limit, mrr_cents, primary_contact_email, notes, is_live, created_at
) VALUES (
	1,
	'Beacon',
	'beacon',
	'scale',
	'active',
	NULL,
	'2026-08-30',
	10,
	49900,
	'avery@beacon.com',
	'Live demo workspace that powers /app.',
	1,
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-190 days')
);

-- Existing team rows belong to Beacon until seed refreshes them.
ALTER TABLE team_members ADD COLUMN workspace_id INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_team_members_workspace_id ON team_members (workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_billing_status ON workspaces (billing_status);
CREATE INDEX IF NOT EXISTS idx_workspaces_plan_id ON workspaces (plan_id);
