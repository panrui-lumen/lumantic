-- Per-user account preferences (display + email). Workspace-level
-- company_settings keep invite domains and company name for admins.

ALTER TABLE user_profile ADD COLUMN ui_locale TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE user_profile ADD COLUMN display_currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE user_profile ADD COLUMN time_format TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE user_profile ADD COLUMN timezone TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE user_profile ADD COLUMN email_proposed_memories INTEGER NOT NULL DEFAULT 1;
ALTER TABLE user_profile ADD COLUMN email_daily_digest INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profile ADD COLUMN email_team_invites INTEGER NOT NULL DEFAULT 1;
ALTER TABLE user_profile ADD COLUMN email_billing INTEGER NOT NULL DEFAULT 1;

-- Seed from existing workspace defaults when present.
UPDATE user_profile
SET
	ui_locale = COALESCE((SELECT ui_locale FROM company_settings WHERE id = 1), ui_locale),
	display_currency = COALESCE((SELECT display_currency FROM company_settings WHERE id = 1), display_currency),
	time_format = COALESCE((SELECT time_format FROM company_settings WHERE id = 1), time_format),
	timezone = COALESCE((SELECT timezone FROM company_settings WHERE id = 1), timezone),
	email_proposed_memories = COALESCE((SELECT email_proposed_memories FROM company_settings WHERE id = 1), email_proposed_memories),
	email_daily_digest = COALESCE((SELECT email_daily_digest FROM company_settings WHERE id = 1), email_daily_digest),
	email_team_invites = COALESCE((SELECT email_team_invites FROM company_settings WHERE id = 1), email_team_invites),
	email_billing = COALESCE((SELECT email_billing FROM company_settings WHERE id = 1), email_billing)
WHERE id = 1;
