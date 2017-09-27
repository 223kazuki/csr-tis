SELECT c.*, u.first_name as primary_user_first_name, u.last_name as primary_user_last_name, u.email as primary_user_email
FROM conversations c
LEFT JOIN users u on u.id = (c.metadata->>'primary_user_id')::integer
WHERE c.metadata IS NOT NULL AND c.metadata->>'owner_id' = $1::text AND c.metadata->>'status' = 'active'
ORDER BY c.last_message->'sent_at' DESC;