ALTER TABLE users ADD COLUMN IF NOT EXISTS salesforce_id text;
CREATE INDEX IF NOT EXISTS salesforce_id_idx ON users(salesforce_id);
