INSERT INTO oauth_tokens (user_id, service, access_token, refresh_token, metadata)
VALUES ($1, $2, $3, $4, $5::jsonb)
ON CONFLICT (user_id, service) DO UPDATE SET (access_token, refresh_token, metadata) = ($3, $4, $5::jsonb);