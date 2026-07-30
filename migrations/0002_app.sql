-- Tables backing the /app product experience (Slack integration, memories,
-- proposed memories, and the AI chat).

CREATE TABLE IF NOT EXISTS slack_settings (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	connected INTEGER NOT NULL DEFAULT 0,
	workspace_name TEXT,
	bot_name TEXT NOT NULL DEFAULT 'Lumantic',
	default_channel_id TEXT,
	default_channel_name TEXT,
	post_proposed_memories INTEGER NOT NULL DEFAULT 1,
	post_daily_digest INTEGER NOT NULL DEFAULT 1,
	notify_on_new_memory INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO slack_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS slack_channels (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	is_private INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO slack_channels (id, name, is_private) VALUES
	('C01GENERAL', 'general', 0),
	('C02DATATEAM', 'data-team', 0),
	('C03ALERTS', 'data-alerts', 0),
	('C04EXEC', 'exec-metrics', 0),
	('C05RANDOM', 'random', 0),
	('C06LEADERSHIP', 'leadership', 1);

CREATE TABLE IF NOT EXISTS memories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	content TEXT NOT NULL,
	category TEXT NOT NULL DEFAULT 'general',
	source TEXT NOT NULL DEFAULT 'manual',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories (created_at);

INSERT INTO memories (content, category, source) VALUES
	('Beacon new-signup volume dropped ~58% starting March 3, 2026 after the checkout redesign broke Google OAuth for first-time workspaces (oauth_callback 500). Fix shipped March 18 in Beacon web 1.48.2.', 'insight', 'ai'),
	('A Beacon session ends after 30 minutes of idle with no client events. Heartbeat pings alone do not keep a session alive.', 'definition', 'manual'),
	('Beacon client crashes are unhandled JS exceptions from the web SDK. /dashboard/signals throws when feature_key is null on sandbox orgs — a known gotcha.', 'gotcha', 'ai'),
	('Beacon Score always excludes orgs tagged env = sandbox and the internal beacon-dogfood workspace — those can inflate Score by ~3–5% if left in.', 'gotcha', 'ai'),
	('A Beacon signal is any client event with event_type = signal that includes a non-null feature_key. Page views and heartbeats are not signals.', 'definition', 'ai'),
	('Beacon Active Workspaces (BAW) are workspaces with at least one Beacon signal in the trailing 30 days; sandbox and internal-demo orgs are excluded. Trials with signals are included in product dashboards.', 'business-rule', 'ai');

CREATE TABLE IF NOT EXISTS proposed_memories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	content TEXT NOT NULL,
	category TEXT NOT NULL DEFAULT 'general',
	source TEXT NOT NULL DEFAULT 'ai',
	confidence REAL NOT NULL DEFAULT 0.8,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO proposed_memories (content, category, source, confidence) VALUES
	('Longest-session rankings should exclude Beacon internal dogfood accounts (email domain @beacon.com) — they skew the top 10.', 'gotcha', 'ai', 0.88),
	('Signup recovery after the March OAuth fix should be measured from March 19 onward; March 18 still includes partial outage hours.', 'business-rule', 'ai', 0.9),
	('Crash reports on /settings/billing spike when the invoice PDF iframe is blocked by corporate CSP — correlate with enterprise SSO workspaces.', 'insight', 'ai', 0.76);

CREATE TABLE IF NOT EXISTS conversations (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL DEFAULT 'New chat',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
	role TEXT NOT NULL,
	content TEXT NOT NULL,
	suggested_memory TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages (conversation_id, id);
