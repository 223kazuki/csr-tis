CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
  user_id integer NOT NULL
);
CREATE INDEX IF NOT EXISTS user_id_idx on sessions(user_id);