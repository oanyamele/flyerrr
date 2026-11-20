# Flyerrr - Requirements Traceability Matrix

Lab 5 sprint execution review. Snapshot: November 01, 2026, 11:17 PM ET.

- [GitHub Project Board](https://github.com/users/oanyamele/projects/1)
- [Sprint Summary](SPRINT_SUMMARY_LAB5.md)
- Verified main commit: `cf6a1ec0e0cc88012994b5b707814aefe3a82632`.

## Scope and status rules

The updated copy of the team's [Flyerrr RTM workbook](https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk) is the primary RTM. Its nine original user stories (`US-01` through `US-09`), 22 product feature IDs and existing mappings are preserved. The updated copy includes implementation/evidence columns and a `Lab 5 Sprint` traceability tab. This repository document provides detailed acceptance evidence for that same backlog. Supplemental `L5-REQ-NNN` identifiers derive from issue acceptance criteria and do not replace the team's user stories. Board F1-F6 workstreams and product feature IDs use separate namespaces.

Ticket state is the primary completion record: six issues are closed/Done, three In Progress and 21 Backlog. PR integration and remaining acceptance evidence are recorded separately. Existing forward/reverse mapping inconsistencies, including the undefined Feature ID List row 10 versus reverse F7 Geofence Validation, are retained and flagged for the team. Technical mappings in the sprint tab indicate affected/supporting requirements, not full story completion.

The board's existing Done statuses are preserved. An issue marked Done is not automatically treated as merged or fully accepted: implementation, integration, verification and outstanding approvals are recorded separately. Dependencies added for this review describe technical sequencing and are not evidence of a team planning meeting. Existing milestone names are preserved; no historical sprint dates or commitments are invented.

## Team user-story status

| Requirement | Status | Tickets | Evidence / remaining work |
|---|---|---|---|
| US-01 - Browse Event Feed | Partial | #17, #21, #31, #43 | Merged accessibility PR #40; repository PR #42 and Explore PR #38 are open. Live query migration #17 and officer-created Explore search #21 are incomplete. |
| US-02 - View Event Details | Partial | #7, #21, #31, #43 | Detail UI and merged accessibility changes exist; repository slice passes branch tests. Server-side bookmarks #21 and complete detail/page acceptance remain. |
| US-03 - NFC Tap-In Check-In | Not implemented | #16, #18, #19, #32 | NFC remains simulated; no real Web NFC implementation is evidenced. Choose/remove NFC simulation #32; implement trusted auth/token/attendance loop #16/#18/#19. |
| US-04 - QR Code Backup Check-In | Partial prototype | #16, #18, #19, #31 | Merged QR token alternative improves accessibility; no trusted server-issued QR flow verified. Secure single-use tokens #18, persisted attendance #19 and actual QR scanning acceptance. |
| US-05 - Saved Events Reminder | Incomplete | #16, #21 | Reminder UI exists; no persisted per-user bookmark/reminder service completion evidenced. Server-side saved events #21 and notification delivery acceptance. |
| US-06 - Create & Publish an Event | Partial prototype | #13, #14, #17, #29, #43 | Local event creation/persistence verified by PR #42 tests; branch remains open. API #14, query publishing #17, form validation #29 and team schema acceptance. |
| US-07 - Real-Time Attendance Dashboard | Incomplete | #18, #19, #20, #24 | Existing reporting UI is not proof of live attendance data. Trusted check-in #18/#19 and live reporting/derived outputs #20; E2E #24. |
| US-08 - Verify Organization Account / Login | Partial prototype | #14, #16, #22, #29, #43 | Local account/repository tests pass; PR #39 is auth planning only. Server auth/roles #16, persisted verification #22 and API #14. |
| US-09 - Export Attendance Report | Partial prototype | #19, #20, #23 | CSV/report code exists; current live-attendance export acceptance is not established. Persist attendance #19, wire reports/CSV to live data #20 and verify escaping/data tests #23. |

## Traceability index

| Requirement | Backlog item | Owner | Board state | Verified outcome | Evidence |
|---|---|---|---|---|---|
| [L5-REQ-005](#l5-req-005) | [#5](https://github.com/oanyamele/flyerrr/issues/5) F4.1 - Convert all draft board items to real GitHub Issues | Brian-Two | Done | Tracking improved | Issue / live board |
| [L5-REQ-006](#l5-req-006) | [#6](https://github.com/oanyamele/flyerrr/issues/6) F3.1 - Add CI workflow: typecheck, lint, test, build on every PR | oanyamele | Backlog | Incomplete | Issue / live board |
| [L5-REQ-007](#l5-req-007) | [#7](https://github.com/oanyamele/flyerrr/issues/7) F5.1 - Fix conditional React hooks in EventDetail.tsx | neaylasimone | Backlog | Incomplete | Issue / live board |
| [L5-REQ-008](#l5-req-008) | [#8](https://github.com/oanyamele/flyerrr/issues/8) F4.3 - Add .nvmrc, engines field, and a real README | nadcaesar | Backlog | Incomplete | Issue / live board |
| [L5-REQ-009](#l5-req-009) | [#9](https://github.com/oanyamele/flyerrr/issues/9) F4.4 - Standardize on one package manager; delete competing lockfiles | Brian-Two | Done | Implemented; PR open | [PR #35](https://github.com/oanyamele/flyerrr/pull/35) |
| [L5-REQ-010](#l5-req-010) | [#10](https://github.com/oanyamele/flyerrr/issues/10) F3.2 - Resolve 11 dependency vulnerabilities and restore Playwright | oanyamele | Backlog | Incomplete | Issue / live board |
| [L5-REQ-011](#l5-req-011) | [#11](https://github.com/oanyamele/flyerrr/issues/11) F4.2 - Enable branch protection on main | neaylasimone | Backlog | Incomplete | Issue / live board |
| [L5-REQ-012](#l5-req-012) | [#12](https://github.com/oanyamele/flyerrr/issues/12) F5.2 - Remove dead code: 3 unreferenced components and 33 unused UI files | nadcaesar | Backlog | Incomplete | Issue / live board |
| [L5-REQ-013](#l5-req-013) | [#13](https://github.com/oanyamele/flyerrr/issues/13) F1.2 - Design the relational schema with ISO timestamps | Brian-Two | Done | Design prepared; PR open | [PR #36](https://github.com/oanyamele/flyerrr/pull/36) |
| [L5-REQ-014](#l5-req-014) | [#14](https://github.com/oanyamele/flyerrr/issues/14) F1.3 - Stand up API service and Postgres with a staging environment | oanyamele | Backlog | Incomplete | Issue / live board |
| [L5-REQ-015](#l5-req-015) | [#15](https://github.com/oanyamele/flyerrr/issues/15) F1.4 - Introduce a repository interface between pages and storage | neaylasimone | Backlog | Incomplete | [PR #42](https://github.com/oanyamele/flyerrr/pull/42) |
| [L5-REQ-016](#l5-req-016) | [#16](https://github.com/oanyamele/flyerrr/issues/16) F1.5 - Move authentication server-side with hashed passwords | nadcaesar | In Progress | In progress | [PR #39](https://github.com/oanyamele/flyerrr/pull/39) |
| [L5-REQ-017](#l5-req-017) | [#17](https://github.com/oanyamele/flyerrr/issues/17) F1.6 - Migrate the events feed to TanStack Query behind the repository | Brian-Two | Backlog | Incomplete | Issue / live board |
| [L5-REQ-018](#l5-req-018) | [#18](https://github.com/oanyamele/flyerrr/issues/18) F2.1 - Server-issued, HMAC-signed, single-use check-in tokens | oanyamele | Backlog | Incomplete | Issue / live board |
| [L5-REQ-019](#l5-req-019) | [#19](https://github.com/oanyamele/flyerrr/issues/19) F2.2 - Persist an AttendanceRecord on every validated check-in | neaylasimone | Backlog | Incomplete | Issue / live board |
| [L5-REQ-020](#l5-req-020) | [#20](https://github.com/oanyamele/flyerrr/issues/20) F2.3 - Rewire Reports, History, Rewards, and Resume Builder to live data | nadcaesar | Backlog | Incomplete | Issue / live board |
| [L5-REQ-021](#l5-req-021) | [#21](https://github.com/oanyamele/flyerrr/issues/21) F2.4 - Persist saves/bookmarks and point Explore at the database | Brian-Two | Backlog | Incomplete | [PR #38](https://github.com/oanyamele/flyerrr/pull/38) |
| [L5-REQ-022](#l5-req-022) | [#22](https://github.com/oanyamele/flyerrr/issues/22) F2.5 - Persist organization verification decisions | oanyamele | Backlog | Incomplete | Issue / live board |
| [L5-REQ-023](#l5-req-023) | [#23](https://github.com/oanyamele/flyerrr/issues/23) F3.3 - Unit-test the data layer to >= 60% coverage | neaylasimone | Backlog | Incomplete | Issue / live board |
| [L5-REQ-024](#l5-req-024) | [#24](https://github.com/oanyamele/flyerrr/issues/24) F3.4 - E2E: login through check-in through points awarded | nadcaesar | Backlog | Incomplete | Issue / live board |
| [L5-REQ-025](#l5-req-025) | [#25](https://github.com/oanyamele/flyerrr/issues/25) F3.5 - Enable TypeScript strict mode and strictNullChecks | Brian-Two | Backlog | Incomplete | Issue / live board |
| [L5-REQ-026](#l5-req-026) | [#26](https://github.com/oanyamele/flyerrr/issues/26) F5.3 - Route-level code splitting to get initial JS under 250 KB | oanyamele | Backlog | Incomplete | Issue / live board |
| [L5-REQ-027](#l5-req-027) | [#27](https://github.com/oanyamele/flyerrr/issues/27) F4.5 - Remove lovable-tagger and hold a data-layer code-reading session | neaylasimone | Backlog | Incomplete | Issue / live board |
| [L5-REQ-028](#l5-req-028) | [#28](https://github.com/oanyamele/flyerrr/issues/28) F5.4 - Unify localStorage key naming and add schema versioning | nadcaesar | In Progress | In progress | Issue / live board |
| [L5-REQ-029](#l5-req-029) | [#29](https://github.com/oanyamele/flyerrr/issues/29) F5.5 - Adopt react-hook-form and zod validation on all forms | Brian-Two | In Progress | In progress | Issue / live board |
| [L5-REQ-030](#l5-req-030) | [#30](https://github.com/oanyamele/flyerrr/issues/30) F6.1 - Add empty, loading, and error states across all screens | oanyamele | Backlog | Incomplete | Issue / live board |
| [L5-REQ-031](#l5-req-031) | [#31](https://github.com/oanyamele/flyerrr/issues/31) F6.2 - Accessibility pass: keyboard navigation, labels, contrast | neaylasimone | Done | Merged; audit limits | [PR #40](https://github.com/oanyamele/flyerrr/pull/40) |
| [L5-REQ-032](#l5-req-032) | [#32](https://github.com/oanyamele/flyerrr/issues/32) F6.3 - Replace the simulated NFC button or scope real Web NFC | nadcaesar | Backlog | Incomplete | Issue / live board |
| [L5-REQ-033](#l5-req-033) | [#33](https://github.com/oanyamele/flyerrr/issues/33) F1.1 - Document the architecture decision record for the backend stack | Brian-Two | Done | Decision draft; PR open | [PR #37](https://github.com/oanyamele/flyerrr/pull/37) |
| [L5-REQ-043](#l5-req-043) | [#43](https://github.com/oanyamele/flyerrr/issues/43) Lab 3 - Extract user and event use cases behind a repository seam | Brian-Two | Done | Implemented; PR open | [PR #42](https://github.com/oanyamele/flyerrr/pull/42) |

## Acceptance criteria and evidence

### L5-REQ-005

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#5: F4.1 - Convert all draft board items to real GitHub Issues](https://github.com/oanyamele/flyerrr/issues/5)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P1-high / 3 / Sprint 0 — Foundation  
**Board state:** Done  
**Verification outcome:** Tracking improved  
**Dependencies:** None; verify governance rubric separately

- **AC-01:** Every draft card on the board is converted to a real GitHub Issue
- **AC-02:** Every issue has: an owner, a P0/P1/P2 label, an estimate, and a sprint milestone
- **AC-03:** Every issue body states acceptance criteria
- **AC-04:** Board has Status, Priority, Estimate, and Sprint fields configured
- **AC-05:** Backlog rubric in report §4.3 scores >= 40/50 on re-audit

**Completion / remaining evidence:** 30 real, assigned issues; Priority/Estimate/Sprint/Dependencies/RTM fields added. #43 remains unestimated and has no milestone. No new 40/50 governance re-audit claimed.

### L5-REQ-006

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#6: F3.1 - Add CI workflow: typecheck, lint, test, build on every PR](https://github.com/oanyamele/flyerrr/issues/6)  
**Owner:** oanyamele  
**Priority / estimate / milestone:** P1-high / 3 / Sprint 0 — Foundation  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** None; required check configuration also needs #11

- **AC-01:** `.github/workflows/ci.yml` runs on `pull_request` and `push` to main
- **AC-02:** Pipeline: install -> `tsc --noEmit` -> `eslint` -> `vitest run` -> `vite build`
- **AC-03:** Pinned to Node 20
- **AC-04:** A PR that breaks the build is visibly blocked
- **AC-05:** CI status badge added to README

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-007

**Team RTM mapping:** US-02, US-03, US-04, US-05. Product features: F3.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#7: F5.1 - Fix conditional React hooks in EventDetail.tsx](https://github.com/oanyamele/flyerrr/issues/7)  
**Owner:** neaylasimone  
**Priority / estimate / milestone:** P1-high / 1 / Sprint 0 — Foundation  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** None; focused hook-order correction

- **AC-01:** Both `useEffect` calls moved above the early return, guarded internally
- **AC-02:** `npx eslint src/pages/EventDetail.tsx` reports 0 errors
- **AC-03:** Navigating from a valid event to `/event/does-not-exist` shows the empty state without crashing
- **AC-04:** Regression test covers the missing-event route

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-008

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#8: F4.3 - Add .nvmrc, engines field, and a real README](https://github.com/oanyamele/flyerrr/issues/8)  
**Owner:** nadcaesar  
**Priority / estimate / milestone:** P1-high / 1 / Sprint 0 — Foundation  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #9 for package-manager instructions

- **AC-01:** `.nvmrc` containing `20`
- **AC-02:** `"engines": { "node": ">=20" }` in package.json
- **AC-03:** README covers: what the project is, prerequisites, setup, scripts, architecture link
- **AC-04:** A teammate can clone and run `npm run dev` using only the README

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-009

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#9: F4.4 - Standardize on one package manager; delete competing lockfiles](https://github.com/oanyamele/flyerrr/issues/9)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P1-high / 1 / Sprint 0 — Foundation  
**Board state:** Done  
**Verification outcome:** Implemented; PR open  
**Dependencies:** None; PR #35 awaits integration

- **AC-01:** One lockfile remains (recommend bun — installed 491 packages in 3.29s)
- **AC-02:** Others deleted and added to .gitignore
- **AC-03:** README documents the chosen manager
- **AC-04:** CI uses the same manager

**Completion / remaining evidence:** PR #35 has one lockfile, ignored alternatives, README instructions and Bun CI. File inspection verified; install/CI success is historical PR evidence. Not integrated into main.

- [PR #35](https://github.com/oanyamele/flyerrr/pull/35), owner `Brian-Two`, head `bd8e60f9cd71dd1f0f021639e83b84e341913b8d`, open / unmerged at snapshot.

### L5-REQ-010

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#10: F3.2 - Resolve 11 dependency vulnerabilities and restore Playwright](https://github.com/oanyamele/flyerrr/issues/10)  
**Owner:** oanyamele  
**Priority / estimate / milestone:** P1-high / 1 / Sprint 0 — Foundation  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** None; restore tooling before #24

- **AC-01:** `npm audit --production` reports 0 high-severity vulnerabilities
- **AC-02:** Playwright config resolves (add the dependency, or replace with a standard config)
- **AC-03:** `npx playwright test` executes without a module-resolution error

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-011

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#11: F4.2 - Enable branch protection on main](https://github.com/oanyamele/flyerrr/issues/11)  
**Owner:** neaylasimone  
**Priority / estimate / milestone:** P1-high / 1 / Sprint 0 — Foundation  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #6 required CI checks; repository admin access

- **AC-01:** Direct pushes to `main` blocked
- **AC-02:** >= 1 approving review required
- **AC-03:** CI check required before merge
- **AC-04:** Branches must be up to date before merging

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-012

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#12: F5.2 - Remove dead code: 3 unreferenced components and 33 unused UI files](https://github.com/oanyamele/flyerrr/issues/12)  
**Owner:** nadcaesar  
**Priority / estimate / milestone:** P2-cleanup / 1 / Sprint 0 — Foundation  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** None; verify references before removal

- **AC-01:** The 3 unreferenced components deleted
- **AC-02:** Unused shadcn/ui components removed
- **AC-03:** Corresponding @radix-ui dependencies removed from package.json
- **AC-04:** Build and tests still pass; bundle size before/after recorded in the PR

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-013

**Team RTM mapping:** US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-09. Product features: F19, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#13: F1.2 - Design the relational schema with ISO timestamps](https://github.com/oanyamele/flyerrr/issues/13)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P0-blocking / 3 / Sprint 1 — Backend & Seam  
**Board state:** Done  
**Verification outcome:** Design prepared; PR open  
**Dependencies:** #33 informs schema design; team approval pending

- **AC-01:** ERD covering users, orgs, events, rsvps, attendance, verifications, follows
- **AC-02:** Events use `starts_at`/`ends_at` as timestamptz; timezone policy documented
- **AC-03:** Migration path from the 9 seed events documented
- **AC-04:** Schema reviewed and approved by all four team members
- **AC-05:** A named owner is assigned to the schema

**Completion / remaining evidence:** PR #36 provides schema design. Team approval by all four members and deployed migrations are not evidenced.

- [PR #36](https://github.com/oanyamele/flyerrr/pull/36), owner `Brian-Two`, head `a5a33f560a286abf86e9dd3a891628e28041c68f`, open / unmerged at snapshot.

### L5-REQ-014

**Team RTM mapping:** US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-09. Product features: F19, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#14: F1.3 - Stand up API service and Postgres with a staging environment](https://github.com/oanyamele/flyerrr/issues/14)  
**Owner:** oanyamele  
**Priority / estimate / milestone:** P0-blocking / 8 / Sprint 1 — Backend & Seam  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #13 and #33 before API/database implementation

- **AC-01:** Stack decision documented (prefer boring: Postgres + a managed host)
- **AC-02:** CRUD endpoints for events and orgs
- **AC-03:** Deployed staging environment reachable from the client
- **AC-04:** Migrations run in CI
- **AC-05:** Health-check endpoint
- **AC-06:** API contract documented (OpenAPI or equivalent)

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-015

**Team RTM mapping:** US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-09. Product features: F1, F3, F11, F19, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#15: F1.4 - Introduce a repository interface between pages and storage](https://github.com/oanyamele/flyerrr/issues/15)  
**Owner:** neaylasimone  
**Priority / estimate / milestone:** P0-blocking / 5 / Sprint 1 — Backend & Seam  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #14 for HTTP adapter; #43 supplies partial local seam

- **AC-01:** `EventRepository`, `AttendanceRepository`, `UserRepository` interfaces defined
- **AC-02:** Two implementations: `HttpRepository` and `LocalStorageRepository`
- **AC-03:** Selected via config/env; localStorage remains the offline and test adapter
- **AC-04:** No page component imports from `src/data/` directly
- **AC-05:** Repository interfaces have unit tests against the localStorage adapter

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

- [PR #42](https://github.com/oanyamele/flyerrr/pull/42), owner `Brian-Two`, head `085f4c5ac0293cbda93b2b699b44ba92828f62bf`, open / unmerged at snapshot.

### L5-REQ-016

**Team RTM mapping:** US-03, US-04, US-05, US-06, US-07, US-08, US-09. Product features: F19.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#16: F1.5 - Move authentication server-side with hashed passwords](https://github.com/oanyamele/flyerrr/issues/16)  
**Owner:** nadcaesar  
**Priority / estimate / milestone:** P0-blocking / 5 / Sprint 1 — Backend & Seam  
**Board state:** In Progress  
**Verification outcome:** In progress  
**Dependencies:** #14 for privileged server endpoints

- **AC-01:** Passwords hashed with bcrypt or argon2, server-side only
- **AC-02:** No credential is ever written to client storage
- **AC-03:** Session tokens are httpOnly cookies or short-lived JWTs
- **AC-04:** Every privileged endpoint enforces role server-side
- **AC-05:** Editing localStorage cannot grant officer access — verified by test
- **AC-06:** Existing seed accounts migrated or reset

**Completion / remaining evidence:** PR #39 is planning documentation; it does not implement server-side authentication.

- [PR #39](https://github.com/oanyamele/flyerrr/pull/39), owner `nadcaesar`, head `bd54447b14c8262d9ea3e27aed527c4debd1d896`, open / unmerged at snapshot.

### L5-REQ-017

**Team RTM mapping:** US-01, US-06. Product features: F1, F14.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#17: F1.6 - Migrate the events feed to TanStack Query behind the repository](https://github.com/oanyamele/flyerrr/issues/17)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P1-high / 5 / Sprint 1 — Backend & Seam  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #15 repository boundary; #14 for live API

- **AC-01:** `useEvents`, `useEvent(id)`, `useCreateEvent` hooks
- **AC-02:** Index, Explore, EventDetail, and Saved consume the hooks
- **AC-03:** Loading and error states rendered (no more synchronous reads in render)
- **AC-04:** Cache invalidated on event creation — replaces the `location.key` refetch hack in Index.tsx:23
- **AC-05:** Officer-created events appear in the feed without a manual refresh

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-018

**Team RTM mapping:** US-03, US-04, US-07. Product features: F8, F9, F19, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#18: F2.1 - Server-issued, HMAC-signed, single-use check-in tokens](https://github.com/oanyamele/flyerrr/issues/18)  
**Owner:** oanyamele  
**Priority / estimate / milestone:** P0-blocking / 8 / Sprint 2 — Core Loop  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #14 and #16 before trusted token issue/validation

- **AC-01:** Tokens issued by the server, HMAC-signed with a server-held secret
- **AC-02:** Server-side validation endpoint; nonces stored in the database
- **AC-03:** Single-use enforced server-side; TTL enforced against server time
- **AC-04:** A tampered or replayed token is rejected — covered by tests
- **AC-05:** **Student on device A, officer on device B: check-in succeeds**

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-019

**Team RTM mapping:** US-03, US-04, US-07, US-09. Product features: F8, F15, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#19: F2.2 - Persist an AttendanceRecord on every validated check-in](https://github.com/oanyamele/flyerrr/issues/19)  
**Owner:** neaylasimone  
**Priority / estimate / milestone:** P0-blocking / 5 / Sprint 2 — Core Loop  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #18 before attendance transaction

- **AC-01:** Successful validation writes an attendance row (event, attendee, timestamp, points)
- **AC-02:** Duplicate check-ins for the same student+event are rejected
- **AC-03:** Points awarded per the event's configured value
- **AC-04:** Officer sees live confirmation reflecting a real persisted record
- **AC-05:** Integration test covers issue -> scan -> persist

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-020

**Team RTM mapping:** US-07, US-09. Product features: F15, F20, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#20: F2.3 - Rewire Reports, History, Rewards, and Resume Builder to live data](https://github.com/oanyamele/flyerrr/issues/20)  
**Owner:** nadcaesar  
**Priority / estimate / milestone:** P0-blocking / 5 / Sprint 2 — Core Loop  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #19 before live attendance-derived outputs

- **AC-01:** All four screens read attendance from the API
- **AC-02:** Points totals computed from real records
- **AC-03:** Badge criteria evaluated against real attendance
- **AC-04:** Resume campus-involvement section generated from real attendance
- **AC-05:** Resume Builder edits persist across reload
- **AC-06:** CSV export reflects live data
- **AC-07:** Empty states render correctly for a brand-new user

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-021

**Team RTM mapping:** US-01, US-02, US-05. Product features: F1, F4.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#21: F2.4 - Persist saves/bookmarks and point Explore at the database](https://github.com/oanyamele/flyerrr/issues/21)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P1-high / 3 / Sprint 2 — Core Loop  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #14 and #16 for server-side per-user persistence

- **AC-01:** Bookmarking persists server-side, per user
- **AC-02:** Saved page lists actually-saved events and survives reload
- **AC-03:** Explore searches live event data
- **AC-04:** An event created by an officer is immediately searchable
- **AC-05:** Likes either persist or the affordance is removed

**Completion / remaining evidence:** PR #38 implements an Explore-search slice but is open and currently conflicts with main; server-side bookmarks and likes remain incomplete.

- [PR #38](https://github.com/oanyamele/flyerrr/pull/38), owner `Brian-Two`, head `582be06d01a8237fd3a725d6d5b1b600405bd747`, open / unmerged at snapshot.

### L5-REQ-022

**Team RTM mapping:** US-08. Product features: F17, F18, F19.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#22: F2.5 - Persist organization verification decisions](https://github.com/oanyamele/flyerrr/issues/22)  
**Owner:** oanyamele  
**Priority / estimate / milestone:** P1-high / 2 / Sprint 2 — Core Loop  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #14 and #16 for authorized persistence

- **AC-01:** Queue reads from the API
- **AC-02:** Approve/reject persists and survives reload
- **AC-03:** Approving an org sets `verified: true` on its profile
- **AC-04:** Only authenticated officers can act — enforced server-side
- **AC-05:** Decisions are audit-logged with actor and timestamp

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-023

**Team RTM mapping:** US-03, US-04, US-07, US-09. Product features: F8, F9, F20, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#23: F3.3 - Unit-test the data layer to >= 60% coverage](https://github.com/oanyamele/flyerrr/issues/23)  
**Owner:** neaylasimone  
**Priority / estimate / milestone:** P1-high / 8 / Sprint 3 — Hardening  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #15 and #18-#20 for complete data-layer coverage

- **AC-01:** The tautological example test is deleted
- **AC-02:** Repository implementations covered
- **AC-03:** Token issue/validate/expire/replay paths covered
- **AC-04:** `getAttendanceSummary` and `buildAttendanceCsv` covered incl. CSV quote escaping
- **AC-05:** Auth flows covered
- **AC-06:** >= 60% line coverage on `src/data/`, enforced in CI

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-024

**Team RTM mapping:** US-03, US-04, US-07. Product features: F8, F9, F15, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#24: F3.4 - E2E: login through check-in through points awarded](https://github.com/oanyamele/flyerrr/issues/24)  
**Owner:** nadcaesar  
**Priority / estimate / milestone:** P1-high / 5 / Sprint 3 — Hardening  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #16 and #18-#20; #10 for E2E tooling

- **AC-01:** Student signs up, signs in, browses the feed
- **AC-02:** Student RSVPs and sees the event in reminders
- **AC-03:** Officer creates an event; it appears in the student feed
- **AC-04:** **Two browser contexts:** student presents a code, officer validates it
- **AC-05:** Student's points increase and attendance history updates
- **AC-06:** Suite runs in CI on every PR

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-025

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#25: F3.5 - Enable TypeScript strict mode and strictNullChecks](https://github.com/oanyamele/flyerrr/issues/25)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P2-cleanup / 5 / Sprint 3 — Hardening  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** None; migrate incrementally by directory

- **AC-01:** `strict: true` and `strictNullChecks: true`
- **AC-02:** `noUnusedLocals` and `noUnusedParameters` enabled
- **AC-03:** `@typescript-eslint/no-unused-vars` re-enabled as an error
- **AC-04:** `tsc --noEmit` passes with zero errors
- **AC-05:** Migrated incrementally by directory, one PR per directory

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-026

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#26: F5.3 - Route-level code splitting to get initial JS under 250 KB](https://github.com/oanyamele/flyerrr/issues/26)  
**Owner:** oanyamele  
**Priority / estimate / milestone:** P2-cleanup / 2 / Sprint 3 — Hardening  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** None; measure initial chunk and route loading

- **AC-01:** Routes loaded with `React.lazy()` + `Suspense`
- **AC-02:** `manualChunks` separates vendor code
- **AC-03:** Initial JS chunk < 250 kB
- **AC-04:** No Vite chunk-size warning
- **AC-05:** Route transitions show a loading state

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-027

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#27: F4.5 - Remove lovable-tagger and hold a data-layer code-reading session](https://github.com/oanyamele/flyerrr/issues/27)  
**Owner:** neaylasimone  
**Priority / estimate / milestone:** P2-cleanup / 2 / Sprint 3 — Hardening  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** None; human code-reading session still required

- **AC-01:** `lovable-tagger` removed from vite.config.ts and package.json
- **AC-02:** Build still succeeds
- **AC-03:** Team session walking `src/data/` and `src/contexts/` line by line
- **AC-04:** Each module has a named owner recorded in the README
- **AC-05:** PRs touching those directories require that owner's review

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-028

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#28: F5.4 - Unify localStorage key naming and add schema versioning](https://github.com/oanyamele/flyerrr/issues/28)  
**Owner:** nadcaesar  
**Priority / estimate / milestone:** P2-cleanup / 2 / Sprint 3 — Hardening  
**Board state:** In Progress  
**Verification outcome:** In progress  
**Dependencies:** #13 informs persisted schema/version migration

- **AC-01:** One prefix and one convention across all keys
- **AC-02:** All keys carry a schema version
- **AC-03:** Migration handles data written under the old keys
- **AC-04:** Keys are centralized in one constants module

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-029

**Team RTM mapping:** US-06, US-08. Product features: F11, F19.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#29: F5.5 - Adopt react-hook-form and zod validation on all forms](https://github.com/oanyamele/flyerrr/issues/29)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P2-cleanup / 3 / Sprint 3 — Hardening  
**Board state:** In Progress  
**Verification outcome:** In progress  
**Dependencies:** #16 for server schema parity; client work can proceed

- **AC-01:** Login and CreateEvent use react-hook-form with zod resolvers
- **AC-02:** University-email format validated
- **AC-03:** Password strength enforced
- **AC-04:** Event capacity and date validated (no events in the past)
- **AC-05:** Field-level error messages rendered
- **AC-06:** Client schemas shared with or mirrored by server validation

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-030

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#30: F6.1 - Add empty, loading, and error states across all screens](https://github.com/oanyamele/flyerrr/issues/30)  
**Owner:** oanyamele  
**Priority / estimate / milestone:** P2-cleanup / 3 / Sprint 3 — Hardening  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #14/#17 for live asynchronous state validation

- **AC-01:** Every list screen has a designed empty state
- **AC-02:** Every async screen has a loading skeleton
- **AC-03:** Every async screen has an error state with retry
- **AC-04:** Verified by walking the app as a freshly created account

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-031

**Team RTM mapping:** US-01, US-02, US-04. Product features: F1, F2, F3, F9.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#31: F6.2 - Accessibility pass: keyboard navigation, labels, contrast](https://github.com/oanyamele/flyerrr/issues/31)  
**Owner:** neaylasimone  
**Priority / estimate / milestone:** P2-cleanup / 3 / Sprint 3 — Hardening  
**Board state:** Done  
**Verification outcome:** Merged; audit limits  
**Dependencies:** PR #40 merged; full manual audit record remains limited

- **AC-01:** All icon-only buttons have accessible names
- **AC-02:** Full keyboard navigation with visible focus indicators
- **AC-03:** Color contrast meets WCAG AA in light and dark themes
- **AC-04:** Axe or Lighthouse accessibility score >= 90
- **AC-05:** QR code has a text alternative

**Completion / remaining evidence:** PR #40 merged into main. Source confirms skip link/main landmark, keyboard handling, labels and QR token text. PR author reports Profile Lighthouse 100; full manual audit not independently repeated.

- [PR #40](https://github.com/oanyamele/flyerrr/pull/40), owner `neaylasimone`, head `fc195a26afe6dba5bcffd178362b47e9b33ea6ba`, merged 2026-10-14T19:06:26Z.

**Fresh validation at main:** 2 files / 7 tests passed (six authentication tests and one tautological example); app TypeScript check and build passed. These are regression checks, not an accessibility certification. Profile Lighthouse 100/100 is historical author evidence in PR #40; no app-wide Lighthouse or WCAG compliance claim is made.

### L5-REQ-032

**Team RTM mapping:** US-03, US-04. Product features: F6, F9.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#32: F6.3 - Replace the simulated NFC button or scope real Web NFC](https://github.com/oanyamele/flyerrr/issues/32)  
**Owner:** nadcaesar  
**Priority / estimate / milestone:** P2-cleanup / 2 / Sprint 3 — Hardening  
**Board state:** Backlog  
**Verification outcome:** Incomplete  
**Dependencies:** #18/#19 for a working primary QR path

- **AC-01:** Team decides: implement Web NFC, or remove the simulation
- **AC-02:** If removed, QR becomes the primary documented path and iPhone copy is corrected
- **AC-03:** If implemented, feature-detected with a graceful QR fallback
- **AC-04:** No UI claims a capability the app does not have

**Completion / remaining evidence:** No completed acceptance evidence recorded for this item at this snapshot.

### L5-REQ-033

**Team RTM mapping:** Cross-cutting support; no new functional story inferred. Product features: cross-cutting support.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#33: F1.1 - Document the architecture decision record for the backend stack](https://github.com/oanyamele/flyerrr/issues/33)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P1-high / 2 / Sprint 1 — Backend & Seam  
**Board state:** Done  
**Verification outcome:** Decision draft; PR open  
**Dependencies:** None; four-member agreement not evidenced

- **AC-01:** `docs/adr/0001-backend-stack.md` recording context, options, decision, consequences
- **AC-02:** At least 3 options evaluated against team skill, hosting cost, and time budget
- **AC-03:** Decision made by end of Week 2 and agreed by all four members
- **AC-04:** Chosen stack is boring and well-documented over novel

**Completion / remaining evidence:** PR #37 provides the backend ADR. Four-member agreement is not evidenced; main does not yet contain the ADR.

- [PR #37](https://github.com/oanyamele/flyerrr/pull/37), owner `Brian-Two`, head `c4efdb7781bec5339bbdcce127dbb08f76fad360`, open / unmerged at snapshot.

### L5-REQ-043

**Team RTM mapping:** US-01, US-02, US-06, US-08. Product features: F1, F3, F11, F14, F19, F21.  
**Primary RTM:** https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

**Backlog:** [#43: Lab 3 - Extract user and event use cases behind a repository seam](https://github.com/oanyamele/flyerrr/issues/43)  
**Owner:** Brian-Two  
**Priority / estimate / milestone:** P1-high / not estimated / Unscheduled  
**Board state:** Done  
**Verification outcome:** Implemented; PR open  
**Dependencies:** Partial slice of #15; PR #42 awaits integration

- **AC-01:** `UserRepository` and `EventRepository` interfaces defined
- **AC-02:** Production adapter uses the existing `localStorage` engine
- **AC-03:** A second adapter (in-memory) runs the same use cases without writing `flyer_db_v1`
- **AC-04:** Login, Index, CreateEvent, EventDetail, TapIn, and EventReminders no longer import `src/data/appDatabase`
- **AC-05:** Repository behavior covered by unit tests
- **AC-06:** Sign-in, feed, event detail, sign-out, rejected password, and event publish keep their current behavior

**Completion / remaining evidence:** PR #42: current 12/12 tests, app TypeScript check and build pass. Five repository tests cover adapter/use-case behavior. Full #15 and server-side security are incomplete.

- [PR #42](https://github.com/oanyamele/flyerrr/pull/42), owner `Brian-Two`, head `085f4c5ac0293cbda93b2b699b44ba92828f62bf`, open / unmerged at snapshot.

**Fresh validation at PR head:** `vitest run` 3 files / 12 tests passed; `tsc -p tsconfig.app.json --noEmit` passed; `vite build` passed. Five repository tests exercise page import boundaries, normalized login and wrong-role rejection, duplicate-account persistence, event ordering/capacity, and in-memory isolation. One of the 12 tests is the pre-existing tautological example and is not feature evidence. Manual UI checks are reported by the PR author, not rerun for this review.

## Original RTM and updated copy

Original source: https://docs.google.com/spreadsheets/d/1R46xUUIlGTvZZjpBeDJd1nPUQdMPm2I9/edit

Updated submission copy: https://docs.google.com/spreadsheets/d/1LuHvkuE1HYGgNPqkwPkx7UWVkCCgAvEPifiz2LQhWZs/edit?usp=drivesdk

Drive rejected the in-place update with insufficient file permissions. The original shared workbook remains unchanged; the user authorized creation of the updated copy. All original cell values and feature mappings were preserved.
