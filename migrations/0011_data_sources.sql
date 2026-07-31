-- Demo data warehouse / remote database connections for Settings.

CREATE TABLE IF NOT EXISTS data_sources (
	id TEXT PRIMARY KEY,
	label TEXT NOT NULL,
	kind TEXT NOT NULL,
	connected INTEGER NOT NULL DEFAULT 0,
	display_name TEXT,
	host TEXT,
	database_name TEXT,
	schema_name TEXT,
	read_only INTEGER NOT NULL DEFAULT 1,
	use_for_chat INTEGER NOT NULL DEFAULT 1,
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO data_sources (id, label, kind, host, database_name, schema_name) VALUES
	('snowflake', 'Snowflake', 'warehouse', 'beacon.us-east-1.snowflakecomputing.com', 'BEACON_WH', 'ANALYTICS'),
	('bigquery', 'BigQuery', 'warehouse', 'bigquery.googleapis.com', 'beacon-prod', 'analytics'),
	('postgres', 'Postgres', 'database', 'analytics.db.beacon.internal', 'beacon', 'public'),
	('redshift', 'Redshift', 'warehouse', 'beacon-wh.abc123.us-east-1.redshift.amazonaws.com', 'beacon', 'analytics'),
	('databricks', 'Databricks', 'lakehouse', 'dbc-beacon.cloud.databricks.com', 'hive_metastore', 'analytics'),
	('mysql', 'MySQL', 'database', 'app-replica.db.beacon.internal', 'beacon_app', 'beacon');
