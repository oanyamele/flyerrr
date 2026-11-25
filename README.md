# flyer

[![CI](https://github.com/oanyamele/flyerrr/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/oanyamele/flyerrr/actions/workflows/ci.yml)

Campus event discovery and attendance prototype built with React and TypeScript.

## Shared saved events

See [the bookmark backend guide](docs/bookmarks-backend.md) to run PostgreSQL,
server authentication, shared event publishing/search, and per-user bookmarks.
The original browser-only mode remains available for offline demos.

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
