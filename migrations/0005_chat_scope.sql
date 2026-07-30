-- Lets conversations be either personal (default) or global — a shared,
-- read-only feed of chats "asked agentically" across the team. This
-- replaces the hardcoded mock conversations that used to live in the
-- ChatPage component; see scripts/seed.sql for the demo fixtures.
ALTER TABLE conversations ADD COLUMN scope TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE conversations ADD COLUMN author_name TEXT;

CREATE INDEX IF NOT EXISTS idx_conversations_scope ON conversations (scope, updated_at);
