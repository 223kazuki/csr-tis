CREATE TABLE IF NOT EXISTS users (
  id              serial PRIMARY KEY,
  created_at      timestamp with time zone NOT NULL DEFAULT current_timestamp,
  email           text NOT NULL,
  password_digest text,
  first_name      text,
  last_name       text,
  metadata        jsonb
);
ALTER SEQUENCE users_id_seq RESTART WITH 1000000;
CREATE UNIQUE INDEX IF NOT EXISTS email_idx ON users (lower(email));