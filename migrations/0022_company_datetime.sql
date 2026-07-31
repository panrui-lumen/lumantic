-- Workspace time display preferences (12/24h + timezone; auto follows the browser).

ALTER TABLE company_settings ADD COLUMN time_format TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE company_settings ADD COLUMN timezone TEXT NOT NULL DEFAULT 'auto';
