-- Schema for the workspace areas (Team, Billing, Support) that used to be
-- client-only mock state. These tables hold the *shape* of real data; run
-- `npm run db:seed` afterwards to populate them with realistic demo content.

CREATE TABLE IF NOT EXISTS team_members (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	role TEXT NOT NULL DEFAULT 'Member',
	status TEXT NOT NULL DEFAULT 'invited',
	is_you INTEGER NOT NULL DEFAULT 0,
	last_active_at TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS billing_plan (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	plan_id TEXT NOT NULL DEFAULT 'scale',
	renews_at TEXT NOT NULL DEFAULT '2026-08-30',
	card_brand TEXT NOT NULL DEFAULT 'Visa',
	card_last4 TEXT NOT NULL DEFAULT '4242',
	card_exp TEXT NOT NULL DEFAULT '08/28',
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO billing_plan (id) VALUES (1);

CREATE TABLE IF NOT EXISTS billing_invoices (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	invoice_date TEXT NOT NULL,
	description TEXT NOT NULL,
	amount_cents INTEGER NOT NULL,
	status TEXT NOT NULL DEFAULT 'Paid',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Usage that has no natural home in another table (we don't run a real
-- Slack integration, so posts-to-Slack can't be counted from real events).
-- Message/memory/seat usage is instead computed live from the real
-- chat_messages, memories, and team_members tables.
CREATE TABLE IF NOT EXISTS usage_counters (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	slack_posts INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO usage_counters (id) VALUES (1);

CREATE TABLE IF NOT EXISTS support_tickets (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	subject TEXT NOT NULL,
	message TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'Open',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets (created_at);
