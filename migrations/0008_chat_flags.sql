-- Pin and archive flags for chat conversations.
ALTER TABLE conversations ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE conversations ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
