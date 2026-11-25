BEGIN;
-- Organizations own events. An account can belong to several organizations, and each
-- membership is either a plain member or a leader. Only leaders manage an organization's
-- events and members. Handles are stored without the leading "@" and are unique ignoring case.
CREATE TABLE IF NOT EXISTS api_organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  handle text NOT NULL CHECK (handle ~ '^[A-Za-z0-9_]{3,30}$'),
  created_by uuid NOT NULL REFERENCES api_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS api_organizations_handle_key ON api_organizations (lower(handle));
CREATE TABLE IF NOT EXISTS api_organization_members (
  organization_id uuid NOT NULL REFERENCES api_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS api_organization_members_user ON api_organization_members(user_id);

-- Every event belongs to an organization.
ALTER TABLE api_events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES api_organizations(id);

-- Existing events were published under an organization made up from the creator's name.
-- Give each creator one real organization (they lead it) and attach their events to it.
-- Organization ids are new, so anything keyed by the old made-up id (such as follows kept
-- in a browser) does not carry over.
DO $$
DECLARE
  creator record;
  new_id uuid;
BEGIN
  FOR creator IN
    SELECT DISTINCT u.id, u.name
    FROM api_events e JOIN api_users u ON u.id = e.created_by
    WHERE e.organization_id IS NULL
  LOOP
    new_id := gen_random_uuid();
    INSERT INTO api_organizations (id, name, handle, created_by)
    VALUES (
      new_id,
      creator.name || ' Org',
      coalesce(nullif(left(lower(regexp_replace(creator.name, '[^A-Za-z0-9]', '', 'g')), 20), ''), 'org')
        || '_' || left(replace(new_id::text, '-', ''), 6),
      creator.id
    );
    INSERT INTO api_organization_members (organization_id, user_id, role) VALUES (new_id, creator.id, 'leader');
    UPDATE api_events SET organization_id = new_id WHERE created_by = creator.id AND organization_id IS NULL;
  END LOOP;
END $$;

ALTER TABLE api_events ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS api_events_organization ON api_events(organization_id);
COMMIT;
