-- Demo GitHub App connection for the /app Settings integrations.

CREATE TABLE IF NOT EXISTS github_settings (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	connected INTEGER NOT NULL DEFAULT 0,
	org_name TEXT,
	account_login TEXT,
	default_repo_id TEXT,
	default_repo_name TEXT,
	sync_metric_defs INTEGER NOT NULL DEFAULT 1,
	comment_on_analytics_prs INTEGER NOT NULL DEFAULT 1,
	watch_schema_changes INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO github_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS github_repos (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	full_name TEXT NOT NULL,
	private INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO github_repos (id, name, full_name, private) VALUES
	('R01WEB', 'beacon-web', 'beacon/beacon-web', 0),
	('R02ANALYTICS', 'beacon-analytics', 'beacon/beacon-analytics', 1),
	('R03DBT', 'beacon-dbt', 'beacon/beacon-dbt', 1),
	('R04SDK', 'beacon-js', 'beacon/beacon-js', 0),
	('R05INFRA', 'beacon-infra', 'beacon/beacon-infra', 1);
