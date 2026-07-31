-- Workspace product UI language preference (auto or a concrete locale).
ALTER TABLE company_settings ADD COLUMN ui_locale TEXT NOT NULL DEFAULT 'auto';
