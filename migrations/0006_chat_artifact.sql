-- Persist rich chat artifacts (charts/tables) returned by the simulated AI.
ALTER TABLE chat_messages ADD COLUMN artifact TEXT;
