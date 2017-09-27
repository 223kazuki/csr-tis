SELECT
  leads.*,
  leads.id AS lead_id,
  users.id,
  users.created_at,
  users.email,
  users.first_name,
  users.last_name,
  users.metadata
FROM leads, lead_users, users WHERE leads.id = lead_users.lead_id AND lead_users.user_id = $1 AND users.id = $1;

-- SELECT
--   leads.*,
--   leads.id AS lead_id,
--   users.id,
--   users.created_at,
--   users.email,
--   users.first_name,
--   users.last_name,
--   users.metadata,
--   sids.remote_id AS salesforce_id
-- FROM leads, lead_users, users
-- RIGHT JOIN (SELECT * FROM integration_ids WHERE service = 'salesforce') sids ON sids.user_id = users.id
-- WHERE 
--   leads.id = lead_users.lead_id AND 
--   lead_users.user_id = $1 AND 
--   users.id = $1;