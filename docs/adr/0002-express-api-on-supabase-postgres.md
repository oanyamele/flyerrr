# ADR 0002: Express API with Supabase-hosted PostgreSQL

- **Status:** Proposed. Needs explicit approval from all four deciders, as in ADR 0001.
- **Related:** ADR 0001 (backend stack, PR #37), issue #14, issue #33
- **Deciders:** oanyamele, neaylasimone, nadcaesar, Brian-Two

## Context

ADR 0001 proposed Supabase as the whole backend: Supabase Auth, row level security,
`supabase-js` in the browser and Edge Functions for privileged work. It was never approved.
In the meantime the team built and merged a different backend: an Express API in `server/`
with PostgreSQL, Argon2id password hashing, HttpOnly cookie sessions, versioned SQL
migrations, event, organization and bookmark endpoints, and an OpenAPI contract
(`docs/openapi.json`). On November 19 nadcaesar asked whether ADR 0001 should be updated to
record what was built.

Issue #14 still needs a deployed staging environment. Supabase cannot run the Express
server, so the choice is between rewriting the backend to follow ADR 0001 and keeping the
Express API with a hosting arrangement that still uses the stack the team picked.

## Decision

Keep the Express API. Use a **Supabase project as the managed PostgreSQL database** for
staging, and run the API, which also serves the built web app, as one container on a free
web host (Render). The database is reached through the session pooler with verified TLS.

Supabase's other features are not used. Row level security is turned on for every table with
no policies, so Supabase's public data API cannot read them, and only the API can.

## Consequences

### Positive

- No rewrite. The merged API, migrations, tests and contract stay as they are.
- A durable, free PostgreSQL database that does not expire after 30 days, which was the main
  objection to Render's free Postgres in ADR 0001.
- The database stays standard PostgreSQL, so moving hosts means changing `DATABASE_URL`.

### Negative

- Two vendors to operate, not one.
- Supabase Auth, Realtime and Edge Functions are not available to the app. Live attendance
  updates and signed check-in credentials would have to be built in the API.
- The free web service sleeps when idle, and free Supabase projects may pause after inactivity.

## If this is accepted

ADR 0001 changes to Superseded in part: its choice of PostgreSQL stays, and its choice of
Supabase Auth, RLS policies, `supabase-js` and Edge Functions is replaced by this decision.

## Approval record

| Team member | Approval | Date |
|---|---|---|
| oanyamele | Pending | n/a |
| neaylasimone | Pending | n/a |
| nadcaesar | Pending | n/a |
| Brian-Two | Pending | n/a |
