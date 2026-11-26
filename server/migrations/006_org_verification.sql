BEGIN;
-- Organizations start out pending. An officer who does not lead the organization approves or
-- rejects it. "Verified" on an organization's profile means its status is approved.
ALTER TABLE api_organizations ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending'
  CHECK (verification_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE api_organizations ADD COLUMN IF NOT EXISTS verification_decided_at timestamptz;
ALTER TABLE api_organizations ADD COLUMN IF NOT EXISTS verification_decided_by uuid REFERENCES api_users(id) ON DELETE SET NULL;

-- Every decision is recorded, so a verification can be traced and reversed. The log keeps the
-- organization's name and the officer's email as they were, and it survives the deletion of
-- either one (organization_id and actor_id are cleared, the snapshots stay).
CREATE TABLE IF NOT EXISTS api_org_verification_decisions (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES api_organizations(id) ON DELETE SET NULL,
  organization_name text NOT NULL,
  actor_id uuid REFERENCES api_users(id) ON DELETE SET NULL,
  actor_email text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  previous_status text NOT NULL CHECK (previous_status IN ('pending', 'approved', 'rejected')),
  note text,
  decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_org_verification_decisions_org ON api_org_verification_decisions(organization_id, decided_at);

-- Same protection as migrations 004 and 005: only this API can reach the table through
-- Supabase's public data API.
ALTER TABLE api_org_verification_decisions ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE api_org_verification_decisions FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
COMMIT;
