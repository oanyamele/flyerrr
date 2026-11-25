BEGIN;
-- Accounts (officers or students) the event's creator has invited to edit it. The creator
-- is not listed here; ownership is api_events.created_by. Editors can edit but not delete or invite.
CREATE TABLE IF NOT EXISTS api_event_editors (
  event_id uuid NOT NULL REFERENCES api_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES api_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS api_event_editors_user ON api_event_editors(user_id);
COMMIT;
