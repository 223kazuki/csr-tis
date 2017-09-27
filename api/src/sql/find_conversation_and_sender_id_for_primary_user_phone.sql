SELECT c.id AS conversation_id, (c.metadata->>'primary_user_id')::int AS sender_id
FROM leads l INNER JOIN lead_users lu ON lu.lead_id = l.id INNER JOIN conversations c ON (c.metadata->>'primary_user_id')::int = lu.user_id
WHERE l.phone=$1;