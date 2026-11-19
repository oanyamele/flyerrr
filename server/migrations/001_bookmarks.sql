BEGIN;
CREATE TABLE IF NOT EXISTS api_users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'org_officer')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS api_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS api_sessions_expiry ON api_sessions(expires_at);
CREATE TABLE IF NOT EXISTS api_events (
  id uuid PRIMARY KEY,
  created_by uuid NOT NULL REFERENCES api_users(id),
  starts_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS api_event_saves (
  user_id uuid NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES api_events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
COMMIT;
