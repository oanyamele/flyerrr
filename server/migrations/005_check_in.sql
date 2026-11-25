BEGIN;
-- One row per check-in code the server has issued. Only a digest of the signed code is stored,
-- never the code itself. A code is single-use (consumed_at) and expires (expires_at), and both
-- are judged by database time.
CREATE TABLE IF NOT EXISTS api_check_in_nonces (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES api_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
  token_digest text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by uuid REFERENCES api_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_check_in_nonces_holder ON api_check_in_nonces(event_id, user_id);

-- A person can be checked in to an event once. nonce_id ties the attendance to the single code
-- that authorized it. It cascades so that deleting an event, which removes its codes and its
-- attendance in the same statement, cannot trip over this reference. Codes are only ever
-- deleted by those cascades and by cleanup of unused codes.
CREATE TABLE IF NOT EXISTS api_attendance (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES api_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
  nonce_id uuid NOT NULL UNIQUE REFERENCES api_check_in_nonces(id) ON DELETE CASCADE,
  checked_in_by uuid REFERENCES api_users(id) ON DELETE SET NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- Same protection as migration 004, for the new tables: no one but this API can read them
-- through Supabase's public data API.
ALTER TABLE api_check_in_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_attendance ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  role_name text;
  table_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      FOREACH table_name IN ARRAY ARRAY['api_check_in_nonces', 'api_attendance'] LOOP
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', table_name, role_name);
      END LOOP;
    END IF;
  END LOOP;
END $$;
COMMIT;
