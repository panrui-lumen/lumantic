-- Short share links for chats (public or workspace-only).
CREATE TABLE IF NOT EXISTS chat_shares (
	code TEXT PRIMARY KEY,
	conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
	fixture_id TEXT,
	title TEXT NOT NULL,
	is_public INTEGER NOT NULL DEFAULT 0,
	messages_json TEXT NOT NULL DEFAULT '[]',
	created_by TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_shares_conversation ON chat_shares (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_shares_fixture ON chat_shares (fixture_id);
