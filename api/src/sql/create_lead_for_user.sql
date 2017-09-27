WITH lead_insert AS (
  INSERT INTO leads DEFAULT VALUES RETURNING id
)
INSERT INTO lead_users (lead_id, user_id)
SELECT lead_insert.id, $1
FROM lead_insert
RETURNING lead_id;