-- Lumantic staff roster for assigning support ticket owners.
CREATE TABLE IF NOT EXISTS admin_employees (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO admin_employees (name) VALUES
	('Alex'),
	('Sharuk'),
	('Panrui'),
	('Sé');

ALTER TABLE support_tickets ADD COLUMN owner_employee_id INTEGER REFERENCES admin_employees (id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_owner ON support_tickets (owner_employee_id);
