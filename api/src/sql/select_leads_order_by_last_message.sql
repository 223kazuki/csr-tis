SELECT
  users.first_name,
  users.last_name,
  users.email,
  leads.company,
  leads.status,
  owner.first_name || ' ' || owner.last_name AS owner,
  conversation.id as conversation_id,
  conversation.last_message as last_message
FROM
  leads,
  lead_users,
  users,
  (SELECT first_name, last_name FROM users WHERE id = $3) AS owner,
  (SELECT conversations.id, conversations.last_message FROM conversations, users WHERE users.id = (conversations.metadata->>'primary_user_id')::integer) AS conversation
WHERE
  leads.id = lead_users.lead_id
  AND users.id = lead_users.user_id
  AND leads.segment = $1
  AND leads.status = $2
  AND leads.owner_id = $3;
