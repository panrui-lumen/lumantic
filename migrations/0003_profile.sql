-- Editable profile fields for the single demo user, so the "name" / "role"
-- shown in the app shell can be edited and persisted like everything else.
CREATE TABLE IF NOT EXISTS user_profile (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	name TEXT NOT NULL,
	role TEXT NOT NULL,
	company TEXT NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO user_profile (id, name, role, company)
VALUES (1, 'Avery Chen', 'Head of Data', 'Beacon');
