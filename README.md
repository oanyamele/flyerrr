# Flyerrr

[![CI](https://github.com/oanyamele/flyerrr/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/oanyamele/flyerrr/actions/workflows/ci.yml)

Flyerrr is a campus events app for Howard University. Students discover events in
an image-first feed, save and RSVP to them, and check in to earn points.
Organization officers publish events and track attendance.

Built with React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui and TanStack Query.
The optional backend is an Express + PostgreSQL API in `server/`.

## Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20 or later (see `.nvmrc`) | Everything |
| [Bun](https://bun.sh/) | Latest | Installing dependencies (the team's package manager; CI uses `bun install --frozen-lockfile`) |
| [Docker](https://www.docker.com/) | Any recent version | Only for the shared backend mode |

With [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the project folder to
switch to the right Node version. On Node 16 or older, the dev server and ESLint
fail to start.

## Quick start (offline demo mode)

Runs entirely in the browser. Data is stored in `localStorage`, so nothing is
shared between devices or browsers.

```sh
git clone https://github.com/oanyamele/flyerrr.git
cd flyerrr
bun install
bun run dev
```

Open http://localhost:8080. Sign up for an account, or sign in with one of the
demo accounts defined in `src/data/appDatabase.ts`.

## Shared backend mode

Runs the API and a PostgreSQL database, so accounts, published events and saved
events are shared between browsers and survive a restart.

```sh
cp .env.example .env.local
docker compose up -d --wait   # starts PostgreSQL on 127.0.0.1:55432
bun run api:dev               # starts the API on port 3001
```

Then, in a second terminal:

```sh
bun run dev
```

Vite serves the app on http://localhost:8080 and forwards `/api` requests to the
API. `VITE_DATA_BACKEND=http` in `.env.local` switches the app to backend mode;
remove it to go back to the offline demo.

New accounts are always students. To make an officer account, see
[the backend guide](docs/bookmarks-backend.md#accounts-and-event-publishing).

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Start the app on http://localhost:8080 |
| `bun run build` | Production build into `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run typecheck` | Type-check the app, config and server code |
| `bun run lint` | Run ESLint |
| `bun run test` | Run the unit and component tests (Vitest) |
| `bun run test:watch` | Run tests in watch mode |
| `bun run api:dev` | Start the API with auto-reload (needs `.env.local` and the database) |
| `bun run api:start` | Start the API without auto-reload |
| `bun run api:migrate` | Apply pending database migrations (the API also runs them on startup) |
| `bun run api:officer` | Create or promote an officer account |
| `bun run test:api` | API integration tests (needs `TEST_DATABASE_URL`) |
| `bun run test:bookmarks:browser` | Playwright browser tests (needs `TEST_DATABASE_URL`) |

On Node 25 or later, run unit tests with
`NODE_OPTIONS=--no-experimental-webstorage bun run test`, so Node's built-in
`localStorage` does not replace the test environment's.

Every pull request runs type checking, lint, unit tests, API tests, browser tests
and a production build in CI (`.github/workflows/ci.yml`).

## Project layout

```
src/
  pages/        One component per screen (route)
  components/   Shared UI, including loading, empty and error states
  contexts/     Auth, follow and theme state
  hooks/        Data hooks (TanStack Query)
  data/         Repository layer and the offline data stores
  lib/          Browser storage module and utilities
  services/     Session handling and the HTTP client
server/         Express + PostgreSQL API and its migrations
shared/         Validation schemas used by both the app and the API
e2e/            Playwright browser tests
docs/           Architecture, backlog and backend documentation
```

## Data-layer code reading

These modules were walked so the team owns them instead of the Lovable generator. A pull request that edits one of them requests the owner listed here (see `.github/CODEOWNERS`).

| Module | Owner | What it owns |
| --- | --- | --- |
| `src/data/appDatabase.ts` | @neaylasimone | `flyer_db_v1` in localStorage: users, events, attendance, verifications. `getDatabase` seeds that store. `createUser`, `authenticateUser`, `createEventRecord`, and `recordCheckIn` are the writes. `pointsForEvent` is the check-in point value (hackathon 15, open gym 5, new events 10). |
| `src/data/attendanceStore.ts` | @neaylasimone | `AttendanceRecord` shape, the five seed rows, `getAttendanceSummary`, and `buildAttendanceCsv`. |
| `src/data/checkInStore.ts` | @neaylasimone | RSVPs (`flyer_rsvp_v1`), reminders (`flyer_reminders_v1`), and QR tokens (`flyer_checkin_tokens_v1`). A token lasts 20 seconds. Validation accepts only the latest unused token for that student and event. |
| `src/contexts/AuthContext.tsx` | @neaylasimone | Login state. Offline mode loads the session from `authService`. HTTP mode calls `/auth/session` and clears event and bookmark queries on login and logout. |
| `src/contexts/FollowContext.tsx` | @neaylasimone | Followed organization ids in `flyerrr_follows`. `toggleFollow` adds or removes an id and writes the list back. |
| `src/data/bookmarks.ts` | @Brian-Two | Saved events. Offline key is `flyerrr_bookmarks_v1`. With `VITE_DATA_BACKEND=http`, reads and writes go to `/bookmarks`. |
| `src/data/bookmarks.test.ts` | @Brian-Two | Tests for the bookmark read and write paths. |
| `src/data/repository.ts` | @Brian-Two | Async reads the pages use: `fetchEvents`, `fetchEvent`, `saveNewEvent`, `fetchAttendanceForUser`, `fetchAttendanceReport`, `fetchReminderEvents`, `fetchUserStats`. Bad stored JSON throws `DataAccessError` instead of being treated as empty. |
| `src/data/mockEvents.ts` | @nadcaesar | Static organizations and campus events. `getDatabase` copies these into the seeded event list. |
| `src/contexts/ThemeContext.tsx` | @nadcaesar | Light or dark theme. The choice is stored in `flyerrr_theme` and applied as a class on `document.documentElement`. |

## More documentation

- [Backend guide](docs/bookmarks-backend.md): API routes, sessions, security and tests
- [Architecture baseline](docs/architecture.md): the original audit. Written before the backend existed, so its "no backend" sections are historical.
- [Backlog](docs/backlog.csv) and the [project board](https://github.com/users/oanyamele/projects/1)

## Team

Nicholas Caesar, Brian Too, Neayla Jones and Ogechi Anyamele, for Senior Project II
(CSCI-492-01) at Howard University.
