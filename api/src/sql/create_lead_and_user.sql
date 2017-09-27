WITH lead_insert AS (
  INSERT INTO leads (salesforce_id) VALUES ($1) RETURNING id
), user_insert AS (
  INSERT INTO users (email, first_name, last_name) VALUES ($2, $3, $4) RETURNING id
)
INSERT INTO lead_users (lead_id, user_id)
SELECT lead_insert.id, user_insert.id
FROM lead_insert, user_insert
RETURNING lead_id, user_id;