INSERT INTO messages_metadata (id, metadata)
VALUES ($1, $2::jsonb)
ON CONFLICT (id) DO UPDATE SET metadata = $2::jsonb
RETURNING (id, metadata);