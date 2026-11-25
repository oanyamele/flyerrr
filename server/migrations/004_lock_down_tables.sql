BEGIN;
-- Supabase publishes every table in the public schema through its own data API, readable
-- with the project's public anon key unless row level security is on. This API is the only
-- way these tables should be reached, and it connects as the table owner, which is not
-- subject to row level security. Turning it on with no policies therefore denies everyone
-- else, including password hashes in api_users. On plain PostgreSQL it changes nothing for
-- the owner or a superuser.
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_event_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_event_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_organization_members ENABLE ROW LEVEL SECURITY;

-- Also remove the grants Supabase gives its public roles. Skipped where those roles do not exist.
DO $$
DECLARE
  role_name text;
  table_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      FOREACH table_name IN ARRAY ARRAY[
        'schema_migrations', 'api_users', 'api_sessions', 'api_events', 'api_event_saves',
        'api_event_editors', 'api_organizations', 'api_organization_members'
      ] LOOP
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', table_name, role_name);
      END LOOP;
    END IF;
  END LOOP;
END $$;
COMMIT;
