ALTER TABLE conversations ADD COLUMN author_slack_username TEXT;
ALTER TABLE conversations ADD COLUMN source_kind TEXT NOT NULL DEFAULT 'app';
ALTER TABLE conversations ADD COLUMN source_channel TEXT;
