-- Profile photo stored as a compact data URL (circular crop exported client-side).
ALTER TABLE user_profile ADD COLUMN avatar TEXT;
