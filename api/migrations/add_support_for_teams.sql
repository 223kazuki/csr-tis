CREATE TABLE IF NOT EXISTS teams (
  app_id      text PRIMARY KEY,
  created_at  timestamp with time zone NOT NULL DEFAULT current_timestamp,
  sapi_token  text
);

DROP INDEX IF EXISTS email_idx;
CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS team_id text,
  ADD COLUMN IF NOT EXISTS roles   text[] NOT NULL DEFAULT array[]::text[];
CREATE INDEX IF NOT EXISTS users_team_id_idx ON users (team_id);