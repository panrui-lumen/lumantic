-- Email notification prefs, invite domain allowlist for the workspace.

ALTER TABLE company_settings ADD COLUMN email_proposed_memories INTEGER NOT NULL DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN email_daily_digest INTEGER NOT NULL DEFAULT 0;
ALTER TABLE company_settings ADD COLUMN email_team_invites INTEGER NOT NULL DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN email_billing INTEGER NOT NULL DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN invite_email_domains TEXT NOT NULL DEFAULT '[]';
