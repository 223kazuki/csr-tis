INSERT INTO leads
  (salesforce_id, owner_id, status, source, phone, company, segment, industry, employees, department, role, address, city, state, zip)
VALUES ($1, (SELECT user_id FROM integration_ids WHERE service='salesforce' AND remote_id = $2), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
ON CONFLICT (salesforce_id) DO UPDATE SET
  (owner_id, status, source, phone, company, segment, industry, employees, department, role, address, city, state, zip)
  = ((SELECT user_id FROM integration_ids WHERE service='salesforce' AND remote_id = $2), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
RETURNING id;
