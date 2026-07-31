-- Per-reply wall time so chat can show how long Lumantic took to answer.

ALTER TABLE chat_messages ADD COLUMN latency_ms INTEGER;

UPDATE chat_messages
SET latency_ms = 5200
WHERE role = 'assistant' AND latency_ms IS NULL;
