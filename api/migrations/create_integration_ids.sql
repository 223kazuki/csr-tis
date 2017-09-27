CREATE TABLE IF NOT EXISTS integration_ids (
  user_id     integer NOT NULL,
  service     text NOT NULL,
  remote_id   text NOT NULL,
  metadata    jsonb,
  created_at  timestamp with time zone NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY(user_id, service)
);