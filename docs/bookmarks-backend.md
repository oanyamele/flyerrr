# Saved events and the bookmark API

The original prototype stores accounts, plaintext demo passwords, events, and
attendance in `localStorage["flyer_db_v1"]`; its session display is stored in
`flyerrr_auth`. RSVP/check-in/reminder state also uses browser storage. That mode
is an offline demonstration and cannot share data between devices.

Issue #21 adds a working **PostgreSQL + TypeScript HTTP API** for the event and
bookmark flow. It follows the cookie-session approach in the team's F1.5 auth
planning branch. The earlier Supabase ADR is a proposal, and the repository has
no Supabase project configuration. This implementation does not require a hosted
account or introduce a paid service.

## Run the shared backend locally

Prerequisites: Node 20+, Bun, and Docker.

```sh
bun install --frozen-lockfile
cp .env.example .env.local
docker compose up -d --wait
bun run api:dev
```

In a second terminal:

```sh
bun run dev
```

Open `http://localhost:8080`. Vite proxies `/api` to the API on port 3001.
The API applies its additive migration on startup. PostgreSQL uses the
`flyerrr_data` Docker volume, so stopping/restarting the API or database preserves
bookmarks. `docker compose down` keeps the volume; removing that volume deletes
the local shared data.

The `.env.example` database password is for the loopback-only local container.
Use deployment secrets for hosted infrastructure; `.env.local` is ignored by Git.
If `VITE_DATA_BACKEND` is omitted, the application uses the existing offline
adapter. Offline bookmarks use `flyerrr_bookmarks_v1`, keyed by user ID, and are
never presented as shared server data. Legacy component-only saves have no
durable state to migrate. Demo accounts and passwords are not copied to the API.

## Accounts and event publishing

Register through the UI to create a student. Passwords are Argon2id hashes on the
server. Sessions use random identifiers in HttpOnly, SameSite=Lax cookies;
only a digest is stored in PostgreSQL. Reload restores the session from the
server, ignoring any prototype `flyerrr_auth` value. Logout revokes the session.
Every API operation resolves the current account and role on the server.

New registrations cannot choose officer privileges. An administrator with
database access provisions an officer explicitly:

```sh
OFFICER_EMAIL=officer@howard.edu \
OFFICER_NAME='Campus Officer' \
OFFICER_PASSWORD='ChooseAnOriginalPassword123' bun run api:officer
```

This command promotes an existing account without resetting its password, or
creates a new officer with the supplied password. Sign in with that account and
publish an event. A separate student/browser can immediately search for it in
Explore, save it, reload, and remove it from Saved.

The shared database intentionally starts empty. Browser demo seed data and
officer-created local-only events are not silently uploaded.

## API contract

All routes are same-site; writes require an `Origin` matching `APP_ORIGIN`.
For production, set `NODE_ENV=production`, an HTTPS `APP_ORIGIN`, and a protected
`DATABASE_URL`. Secure cookies are enabled in production. Serve `/api` through
the same HTTPS origin as the SPA. `API_HOST` defaults to loopback; set it explicitly
when deploying behind a container proxy. Start with `bun run api:start` and supply
environment variables through the host. `PORT` defaults to 3001.

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/health` | Checks PostgreSQL connectivity |
| POST | `/api/auth/register` | Creates a student using shared form validation |
| POST | `/api/auth/login` | Verifies password and issues a session |
| GET | `/api/auth/session` | Restores the server-resolved session |
| POST | `/api/auth/logout` | Revokes the session and clears its cookie |
| GET | `/api/events` | Lists shared events with the caller's saved state |
| GET | `/api/events/:id` | Reads an event; unknown UUID returns 404 |
| POST | `/api/events` | Officer-only publish, using shared event validation |
| GET | `/api/bookmarks` | Lists only the caller's saved events |
| PUT | `/api/bookmarks/:id` | Idempotently saves an existing event |
| DELETE | `/api/bookmarks/:id` | Idempotently removes the caller's save |

Bookmarks have a composite primary key `(user_id, event_id)` and foreign keys
with cascading deletion. Client-supplied user IDs and roles never select an
account. Queries use bound parameters. Public responses contain no password
hash or session identifier. Credential attempts are bounded by email and IP in
one API process; a deployment with multiple replicas needs a shared rate limiter.

`shared/forms.ts` is consumed by both the React forms and API, completing the
schema-parity part of #29. The request includes an ISO start instant and IANA
timezone. Validation checks future dates, real calendar dates, capacity, and
that the instant agrees with the displayed date/time.

## Verification

```sh
bun run typecheck
bun run lint
bun run test
TEST_DATABASE_URL=postgres://flyerrr:flyerrr_dev@127.0.0.1:55432/flyerrr bun run test:api
bunx playwright install chromium
TEST_DATABASE_URL=postgres://flyerrr:flyerrr_dev@127.0.0.1:55432/flyerrr bun run test:bookmarks:browser
bun run build
```

API/browser suites create isolated randomly named PostgreSQL schemas and remove
only those schemas on completion. They cover independent sessions, officer
publish and live search, reload and API restart persistence, idempotence,
cross-account isolation, rejected writes, sign-out/revocation, shared validation,
and failed-save recovery. CI runs the same suites against a PostgreSQL service,
using the Chrome installation supplied by the Ubuntu 24.04 runner. Local tests
use Playwright's Chromium unless `PLAYWRIGHT_CHANNEL` is explicitly set.

## Scope and integration

This is the event/bookmark slice needed by #21 and #29. It uses `api_`-prefixed
tables to avoid colliding with the team's proposed full schema; event presentation
fields are temporarily stored in a JSONB payload with relational IDs, creator,
start timestamp, and saves. The migration is additive and repeatable. A later
full-schema migration must transform those payloads explicitly.

Attendance, RSVP, check-in, reports, organization verification and other prototype
features still use the existing data stores. This work does not complete #14's
staging deployment or #16's app-wide auth migration. No hosted environment was
created or verified. Password recovery, university-email verification, broader
role/organization membership policies, and distributed abuse protection belong
to that authentication/deployment work.

Implementation references: [parameterized PostgreSQL queries](https://node-postgres.com/features/queries),
[Express JSON middleware](https://expressjs.com/en/5x/api/express/), and the installed
`@node-rs/argon2` package's typed API.
