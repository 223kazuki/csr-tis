-- smallint type represents an enum — more flexible than PG `enum` type
CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
  salesforce_id text,
  owner_id integer,
  status smallint,
  source smallint,
  phone text,
  company text,
  segment smallint,
  industry smallint,
  employees smallint,
  department smallint,
  role text,
  address text,
  city text,
  state text,
  zip text,
  country smallint,
  project_timeline smallint,
  project_details text
);
ALTER SEQUENCE leads_id_seq RESTART WITH 2000000;
CREATE UNIQUE INDEX IF NOT EXISTS salesforce_id_idx ON leads(salesforce_id);
CREATE INDEX IF NOT EXISTS owner_id_idx ON leads(owner_id);