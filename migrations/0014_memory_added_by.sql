-- Who added each confirmed memory (person name, or Lumantic for AI-sourced).
ALTER TABLE memories ADD COLUMN added_by TEXT;

UPDATE memories SET added_by = 'Avery Chen' WHERE source = 'manual' AND added_by IS NULL;
UPDATE memories SET added_by = 'Lumantic' WHERE source = 'ai' AND added_by IS NULL;
UPDATE memories SET added_by = 'Avery Chen' WHERE added_by IS NULL;
