-- Company (workspace) settings and per-reply model usage on chat messages.

CREATE TABLE IF NOT EXISTS company_settings (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	display_currency TEXT NOT NULL DEFAULT 'USD',
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO company_settings (id, display_currency) VALUES (1, 'USD');

ALTER TABLE chat_messages ADD COLUMN input_tokens INTEGER;
ALTER TABLE chat_messages ADD COLUMN output_tokens INTEGER;
ALTER TABLE chat_messages ADD COLUMN cost_usd REAL;
