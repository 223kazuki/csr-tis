SELECT l.*,
  l.id AS lead_id,
  (c.metadata->>'primary_user_id')::int AS id,
  u.created_at,
  u.email,
  u.first_name,
  u.last_name,
  u.metadata
FROM users u LEFT OUTER JOIN conversations c ON (c.metadata->>'primary_user_id')::int = u.id INNER JOIN lead_users lu ON lu.user_id = u.id RIGHT OUTER JOIN leads l ON lu.lead_id = l.id
WHERE c.id = $1;