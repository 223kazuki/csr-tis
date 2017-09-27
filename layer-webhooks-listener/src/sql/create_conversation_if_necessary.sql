INSERT INTO conversations (id, participants, metadata)
  VALUES ($1, $2, $3)
  ON CONFLICT (id) DO NOTHING;