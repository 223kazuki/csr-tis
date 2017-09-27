SELECT l.id AS lead_id, l.salesforce_id, c.id AS conversation_id, c.metadata
FROM conversations c, leads l, lead_users lu, users u
WHERE l.salesforce_id = ANY($1) AND lu.lead_id = l.id AND u.id = lu.user_id AND (c.metadata->>'primary_user_id')::int = u.id;