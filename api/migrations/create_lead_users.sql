CREATE TABLE IF NOT EXISTS lead_users (
  lead_id     integer,
  user_id     integer,
  created_at  timestamp with time zone NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY(lead_id, user_id)
);