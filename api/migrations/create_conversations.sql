CREATE TABLE IF NOT EXISTS conversations (
  id            text PRIMARY KEY,
  participants  text[] NOT NULL DEFAULT array[]::text[],
  metadata      jsonb,
  last_message  jsonb
);
