-- Personal Slack identity for the demo user (separate from workspace Slack settings).
-- Used so global chats from Slack can be labeled "You" when handles match.
ALTER TABLE user_profile ADD COLUMN slack_username TEXT;
