# ADR 0001: Backend stack

- **Status:** Proposed — pending four-person team approval
- **Decision date:** September 10, 2026
- **Decision deadline:** End of Week 2
- **Technical owner:** Brian-Two
- **Deciders:** oanyamele, neaylasimone, nadcaesar, Brian-Two
- **Related issue:** [#33](https://github.com/oanyamele/flyerrr/issues/33)

## Context

Flyerrr is currently a React and TypeScript browser application with no server
boundary. Authentication, events, RSVPs, check-in tokens, and other state are
stored in `localStorage`. This prevents multi-device check-in, durable attendance,
server-side authorization, and trustworthy reporting.

The backend must support:

- relational data for users, organizations, events, RSVPs, attendance, and
  verification decisions;
- server-enforced authorization and organization ownership;
- signed, short-lived, single-use check-in credentials;
- atomic duplicate-check-in prevention;
- live attendance updates;
- SQL-based reporting and CSV export;
- repeatable local, staging, and production migrations; and
- delivery within one semester by a team whose repository demonstrates React and
  TypeScript experience but no existing server implementation.

## Decision drivers

1. **Delivery time:** a working staging backend must be available early enough to
   unblock the core attendance loop.
2. **Team fit:** reuse TypeScript where custom server code is necessary and avoid
   building commodity authentication or database operations from scratch.
3. **Relational integrity:** foreign keys, unique constraints, transactions, and
   timestamp-aware reporting are first-class requirements.
4. **Security:** authorization must be enforced outside the browser, and privileged
   credentials must never ship to the client.
5. **Prototype cost:** the class project needs a practical $0 development path and
   a clear paid upgrade path.
6. **Operational simplicity:** the team should operate one cohesive backend rather
   than several independently deployed services.

## Options considered

Hosting information was checked against official provider documentation on
September 10, 2026.

| Option | Team skill fit | Hosting cost | Time budget | Relational/reporting fit | Operational burden |
|---|---|---|---|---|---|
| **A. Supabase: managed PostgreSQL, Auth, RLS, Realtime, and Edge Functions** | Good. The client and privileged functions remain TypeScript; SQL is required for the schema and policies. | Free plan supports two active projects, a 500 MB database, 50,000 monthly active users, and 500,000 Edge Function calls. Pro starts at $25/month. | Best. Database, auth, API, realtime, and functions are available without building deployment plumbing first. | Excellent. It is full PostgreSQL with constraints, transactions, views, and SQL migrations. | Low. One managed platform, with local development through the Supabase CLI. |
| **B. TypeScript API plus managed PostgreSQL on Render** | Good language fit, but the team must also learn an API framework, ORM, authentication, deployment, and database operations at once. | A prototype web service and Postgres instance can run free, but free Render Postgres expires after 30 days; durable use requires paid compute. | Slowest. Every auth, authorization, realtime, and deployment concern must be assembled and maintained. | Excellent. Standard PostgreSQL and a conventional server API. | Highest. Separate API and database services, migrations, sessions, CORS, secrets, health checks, and scaling. |
| **C. Firebase Auth, Firestore, and Cloud Functions** | Good TypeScript SDK fit and quick authentication setup. | Spark starts at $0 with quotas such as 20,000 writes and 50,000 reads per day; paid products move to Blaze usage billing after free quotas. | Fast for authentication and simple CRUD, but slower for this domain's reporting and consistency rules. | Weakest. Attendance reporting and multi-entity integrity must be modeled around documents rather than relational constraints. | Medium. Managed operations, but denormalization and read-based billing require additional design discipline. |

### Sources

- [Supabase pricing](https://supabase.com/pricing)
- [Supabase PostgreSQL overview](https://supabase.com/docs/guides/database/overview)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Render free-service limits](https://render.com/docs/free)
- [Render service types](https://render.com/docs/service-types)
- [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing)

## Decision

Use **Supabase as the managed backend platform**:

- **Database:** PostgreSQL is the system of record.
- **Identity:** Supabase Auth owns credentials and sessions. The application stores
  only the authenticated user's identifier and public profile data.
- **Authorization:** enable Row Level Security on every exposed table, revoke
  unnecessary grants, and add explicit allow policies for each role and operation.
- **Routine data access:** the React client uses `@supabase/supabase-js` behind a
  repository interface. Pages must not call Supabase directly.
- **Privileged operations:** TypeScript Edge Functions issue and validate check-in
  credentials, perform atomic attendance writes, execute administrative transitions,
  and handle other operations that require secrets or elevated privileges.
- **Realtime:** subscribe to authorized attendance changes for live dashboards;
  reconnects must reconcile against a fresh database snapshot.
- **Migrations:** version all schema, constraints, grants, RLS policies, functions,
  and seed transformations as SQL migrations in `supabase/migrations/`.
- **Environments:** use separate local, staging, and production projects. Staging
  must apply the same migrations used locally before any production deployment.

This is intentionally a conventional stack: PostgreSQL, SQL migrations, standard
JWT-backed sessions, database-enforced authorization, and TypeScript for the small
amount of custom server code. Supabase supplies managed infrastructure; it does not
replace clear application boundaries or database design.

## Security boundaries

- Only the publishable client key may be included in the browser bundle.
- Secret and service-role keys are restricted to trusted functions and CI secrets.
- RLS and grants are deny-by-default and tested for anonymous, student,
  organization-leader, and administrator access.
- Check-in signing secrets and raw authentication credentials never enter browser
  storage.
- Privileged functions validate the caller's JWT, role, organization membership,
  event window, nonce, and request payload on every call.
- Attendance uniqueness and nonce consumption are enforced in one database
  transaction, not with client-side checks.

## Delivery sequence

1. Approve this ADR and the relational schema.
2. Create local and staging Supabase projects and commit CLI configuration.
3. Apply schema, constraints, grants, RLS policies, and seed-data migrations.
4. Add repository interfaces and a Supabase adapter.
5. Move authentication to Supabase Auth.
6. Implement the check-in issuance and validation Edge Functions.
7. Migrate the feed, attendance, reporting, and verification screens incrementally.

## Consequences

### Positive

- The team gets a real multi-user PostgreSQL system without first operating a
  custom API service.
- Relational constraints and transactions can enforce the core attendance rules.
- Auth, RLS, Realtime, Storage, and functions share one identity and data platform.
- The repository seam keeps React pages testable and makes the vendor adapter
  replaceable.
- The free tier is sufficient for development and a class demonstration if usage
  stays within published quotas.

### Negative

- The team must learn PostgreSQL, RLS, and the Supabase local-development workflow.
- Free projects may pause after inactivity and do not provide production-grade
  backups or uptime guarantees.
- Edge Functions use Deno-compatible TypeScript rather than the project's browser
  runtime.
- Supabase-specific Auth, Realtime, and function integrations create some vendor
  coupling.

### Mitigations

- Keep domain types and repository interfaces provider-neutral.
- Put all schema and policies in portable SQL migrations.
- Keep routine business logic in SQL functions or tested TypeScript modules instead
  of dashboard-only configuration.
- Export periodic staging backups and document a restore drill before handling real
  student data.
- Revisit the hosting decision if the project exceeds free-tier limits or requires
  an uptime, backup, or compliance commitment.

## Approval record

Approval must be recorded by each teammate during review; absence of an objection is
not approval.

| Team member | Role in this decision | Approval | Date |
|---|---|---|---|
| Brian-Two | Technical owner and author | Pending explicit review | — |
| oanyamele | Project owner and reviewer | Pending | — |
| neaylasimone | Reviewer | Pending | — |
| nadcaesar | Reviewer | Pending | — |

The ADR changes from **Proposed** to **Accepted** only after all four rows contain an
explicit approval and date.
