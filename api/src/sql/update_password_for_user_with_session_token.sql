UPDATE users SET password_digest = $2 WHERE id =
  (SELECT user_id FROM sessions WHERE token = $1 LIMIT 1);