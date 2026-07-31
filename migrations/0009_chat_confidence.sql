-- Confidence score for assistant replies (0-1). Null for user messages.
ALTER TABLE chat_messages ADD COLUMN confidence REAL;
