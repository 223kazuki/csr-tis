DROP INDEX IF EXISTS users_team_id_idx;
ALTER TABLE users
  DROP COLUMN IF EXISTS roles,
  DROP COLUMN IF EXISTS team_id;

DROP INDEX IF EXISTS users_email_idx;
CREATE INDEX IF NOT EXISTS email_idx ON users (lower(email));

DROP TABLE IF EXISTS teams;