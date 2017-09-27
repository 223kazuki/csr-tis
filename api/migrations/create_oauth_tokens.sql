CREATE TABLE IF NOT EXISTS oauth_tokens (
  user_id       integer NOT NULL,
  service       text NOT NULL,
  created_at    timestamp with time zone NOT NULL DEFAULT current_timestamp,
  access_token  text NOT NULL,
  refresh_token text,
  metadata      jsonb,
  PRIMARY KEY(user_id, service)
);