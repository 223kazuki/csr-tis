UPDATE sessions SET token = $2 WHERE token =
  (SELECT token FROM sessions WHERE user_id = $1 LIMIT 1);