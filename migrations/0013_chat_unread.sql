-- Track when a conversation was last opened so we can badge unread chats.
ALTER TABLE conversations ADD COLUMN last_read_at TEXT;

-- Existing threads start as read. New assistant replies after last_read_at count as unread.
UPDATE conversations SET last_read_at = updated_at WHERE last_read_at IS NULL;
