INSERT INTO integration_ids (user_id, service, remote_id, metadata)
VALUES ($1, $2, $3, $4::jsonb)
ON CONFLICT (user_id, service) DO UPDATE SET (remote_id, metadata) = ($3, $4::jsonb);