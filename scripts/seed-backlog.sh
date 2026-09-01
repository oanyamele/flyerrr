#!/usr/bin/env bash
#
# seed-backlog.sh — convert the Project Reset Report (docs/PROJECT_RESET_REPORT.md)
# into a real, traceable GitHub backlog.
#
# Creates: 8 labels, 4 sprint milestones, 28 Issues with acceptance criteria,
# and (optionally) adds every Issue to your GitHub Project Board.
#
# USAGE
#   1. Authenticate with the scopes needed for Issues *and* Projects:
#        gh auth refresh -s project,read:project
#   2. Find your board number:
#        gh project list --owner oanyamele
#   3. Dry run first (prints, creates nothing):
#        ./scripts/seed-backlog.sh --dry-run
#   4. Create the Issues:
#        ./scripts/seed-backlog.sh
#   5. Create AND add to board number 1:
#        ./scripts/seed-backlog.sh --project 1
#
# The script is idempotent for labels and milestones. Re-running it WILL create
# duplicate issues, so run it once.

set -euo pipefail

REPO="${REPO:-oanyamele/flyerrr}"
OWNER="${REPO%%/*}"
PROJECT_NUMBER=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --project) PROJECT_NUMBER="$2"; shift 2 ;;
    --repo)    REPO="$2"; OWNER="${REPO%%/*}"; shift 2 ;;
    -h|--help) sed -n '2,26p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

log()  { printf '\033[0;36m▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[0;32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m!\033[0m %s\n' "$*"; }

command -v gh >/dev/null || { echo "gh CLI not found: https://cli.github.com" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Run 'gh auth login' first." >&2; exit 1; }

$DRY_RUN && warn "DRY RUN — nothing will be created."
log "Repository: $REPO"

# ---------------------------------------------------------------- labels ----
log "Creating labels…"
create_label() {
  $DRY_RUN && { echo "    label: $1"; return; }
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null 2>&1 \
    && ok "label $1" || warn "label $1 (skipped)"
}
create_label "P0-blocking"   "B60205" "Blocks the product from functioning"
create_label "P1-high"       "D93F0B" "Blocks safe development"
create_label "P2-cleanup"    "FBCA04" "Compounding technical debt"
create_label "backend"       "0052CC" "Server tier, API, database"
create_label "security"      "5319E7" "Security or privacy exposure"
create_label "tech-debt"     "C2E0C6" "Refactor, cleanup, dead code"
create_label "testing"       "0E8A16" "Tests and CI"
create_label "process"       "BFD4F2" "Team workflow and tooling"

# ------------------------------------------------------------ milestones ----
log "Creating sprint milestones…"
create_milestone() {
  $DRY_RUN && { echo "    milestone: $1"; return; }
  if gh api "repos/$REPO/milestones" --jq '.[].title' 2>/dev/null | grep -qxF "$1"; then
    warn "milestone $1 (exists)"
  else
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null \
      && ok "milestone $1"
  fi
}
create_milestone "Sprint 0 — Foundation"        "Week 1 · 12 pts · CI, backlog hygiene, quick fixes"
create_milestone "Sprint 1 — Backend & Seam"    "Weeks 2-4 · 26 pts · API, database, repository interface, real auth"
create_milestone "Sprint 2 — Core Loop"         "Weeks 5-7 · 21 pts · Working cross-device check-in and attendance"
create_milestone "Sprint 3 — Hardening"         "Weeks 8-10 · 22 pts · Tests, strict TS, performance"

# ---------------------------------------------------------------- issues ----
CREATED=0
issue() {
  local title="$1" milestone="$2" labels="$3" body="$4"
  if $DRY_RUN; then
    printf '    [%s] %s  (%s)\n' "$milestone" "$title" "$labels"
    CREATED=$((CREATED + 1)); return
  fi
  local url
  url=$(gh issue create --repo "$REPO" \
        --title "$title" --body "$body" \
        --label "$labels" --milestone "$milestone")
  ok "$title → $url"
  CREATED=$((CREATED + 1))
  if [[ -n "$PROJECT_NUMBER" ]]; then
    gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" >/dev/null 2>&1 \
      && printf '      ↳ added to project %s\n' "$PROJECT_NUMBER" \
      || warn "      ↳ could not add to project (need: gh auth refresh -s project)"
  fi
}

log "Creating issues…"

# ============================== SPRINT 0 ====================================
issue "Convert all draft board items to real GitHub Issues" \
  "Sprint 0 — Foundation" "process,P1-high" \
"**Risk:** Backlog Health Assessment, Project Reset Report §4 (scored 7/50)
**Estimate:** 3 points

The Project Board currently holds draft notes only. Draft cards cannot be assigned,
labeled, estimated, linked to a PR, or closed by a commit. Four merged PRs reference
zero issues — there is no traceability from decision to code.

### Acceptance criteria
- [ ] Every draft card on the board is converted to a real GitHub Issue
- [ ] Every issue has: an owner, a P0/P1/P2 label, an estimate, and a sprint milestone
- [ ] Every issue body states acceptance criteria
- [ ] Board has Status, Priority, Estimate, and Sprint fields configured
- [ ] Backlog rubric in report §4.3 scores >= 40/50 on re-audit"

issue "Add CI workflow: typecheck, lint, test, build on every PR" \
  "Sprint 0 — Foundation" "testing,process,P1-high" \
"**Risk:** R-09 — No CI, no branch protection
**Estimate:** 3 points

\`gh api repos/oanyamele/flyerrr/actions/workflows\` returns \`total_count: 0\`.
Four PRs have been merged with zero automated verification.

### Acceptance criteria
- [ ] \`.github/workflows/ci.yml\` runs on \`pull_request\` and \`push\` to main
- [ ] Pipeline: install -> \`tsc --noEmit\` -> \`eslint\` -> \`vitest run\` -> \`vite build\`
- [ ] Pinned to Node 20
- [ ] A PR that breaks the build is visibly blocked
- [ ] CI status badge added to README"

issue "Fix conditional React hooks in EventDetail.tsx" \
  "Sprint 0 — Foundation" "P1-high,tech-debt" \
"**Risk:** R-07 — React hooks called conditionally
**Estimate:** 1 point

\`src/pages/EventDetail.tsx:26-32\` returns early when \`!event\`, but two \`useEffect\`
calls follow at lines 38 and 43. ESLint reports two \`react-hooks/rules-of-hooks\` errors.
React will throw *\"Rendered fewer hooks than expected\"* if the component instance is
reused across a route change from a valid to an invalid event id.

### Acceptance criteria
- [ ] Both \`useEffect\` calls moved above the early return, guarded internally
- [ ] \`npx eslint src/pages/EventDetail.tsx\` reports 0 errors
- [ ] Navigating from a valid event to \`/event/does-not-exist\` shows the empty state without crashing
- [ ] Regression test covers the missing-event route"

issue "Add .nvmrc, engines field, and a real README" \
  "Sprint 0 — Foundation" "process,P1-high" \
"**Risk:** R-12 — Node version requirement undocumented and unmet
**Estimate:** 1 point

README currently reads \`TODO: Document your project here\`. The repo requires Node >= 20
(Vite 5, ESLint 9); on Node 16 \`npx eslint .\` fails with \`ERR_MODULE_NOT_FOUND\`.

### Acceptance criteria
- [ ] \`.nvmrc\` containing \`20\`
- [ ] \`\"engines\": { \"node\": \">=20\" }\` in package.json
- [ ] README covers: what the project is, prerequisites, setup, scripts, architecture link
- [ ] A teammate can clone and run \`npm run dev\` using only the README"

issue "Standardize on one package manager; delete competing lockfiles" \
  "Sprint 0 — Foundation" "tech-debt,process,P1-high" \
"**Risk:** R-11 — Three competing lockfiles
**Estimate:** 1 point

\`bun.lock\`, \`bun.lockb\`, and \`package-lock.json\` are all committed. No single source
of truth for dependency resolution.

### Acceptance criteria
- [ ] One lockfile remains (recommend bun — installed 491 packages in 3.29s)
- [ ] Others deleted and added to .gitignore
- [ ] README documents the chosen manager
- [ ] CI uses the same manager"

issue "Resolve 11 dependency vulnerabilities and restore Playwright" \
  "Sprint 0 — Foundation" "security,testing,P1-high" \
"**Risks:** R-13 (11 vulnerabilities, 10 high) and part of R-08
**Estimate:** 1 point

\`npm audit --production\` reports 11 vulnerabilities including PostCSS path traversal
(GHSA-r28c-9q8g-f849). Separately, \`playwright.config.ts\` and \`playwright-fixture.ts\`
import \`lovable-agent-playwright-config\`, which is absent from package.json — E2E
cannot run at all.

### Acceptance criteria
- [ ] \`npm audit --production\` reports 0 high-severity vulnerabilities
- [ ] Playwright config resolves (add the dependency, or replace with a standard config)
- [ ] \`npx playwright test\` executes without a module-resolution error"

issue "Enable branch protection on main" \
  "Sprint 0 — Foundation" "process,P1-high" \
"**Risk:** R-09 — No branch protection
**Estimate:** 1 point

\`gh api repos/oanyamele/flyerrr/branches/main/protection\` returns 404.

### Acceptance criteria
- [ ] Direct pushes to \`main\` blocked
- [ ] >= 1 approving review required
- [ ] CI check required before merge
- [ ] Branches must be up to date before merging"

issue "Remove dead code: 3 unreferenced components and 33 unused UI files" \
  "Sprint 0 — Foundation" "tech-debt,P2-cleanup" \
"**Risk:** R-15 — Substantial dead code
**Estimate:** 1 point

\`EventDetailModal.tsx\` (209 lines), \`FilterBar.tsx\` (52), and \`NavLink.tsx\` (28) have
zero import sites. 33 of 48 shadcn/ui components are never imported (~2,900 lines), each
carrying a Radix dependency.

### Acceptance criteria
- [ ] The 3 unreferenced components deleted
- [ ] Unused shadcn/ui components removed
- [ ] Corresponding @radix-ui dependencies removed from package.json
- [ ] Build and tests still pass; bundle size before/after recorded in the PR"

# ============================== SPRINT 1 ====================================
issue "Design the relational schema with ISO timestamps" \
  "Sprint 1 — Backend & Seam" "backend,P0-blocking" \
"**Risks:** R-04 (no backend) and R-14 (dates are display strings)
**Estimate:** 3 points

\`mockEvents.ts:62\` stores \`date: \"Fri, Sep 12\"\` and \`time: \"6:00 PM\"\` — no
machine-readable date exists anywhere. Events cannot be sorted, filtered by upcoming/past,
or used to schedule reminders. **Fix this in the schema design, not after.**

### Acceptance criteria
- [ ] ERD covering users, orgs, events, rsvps, attendance, verifications, follows
- [ ] Events use \`starts_at\`/\`ends_at\` as timestamptz; timezone policy documented
- [ ] Migration path from the 9 seed events documented
- [ ] Schema reviewed and approved by all four team members
- [ ] A named owner is assigned to the schema"

issue "Stand up API service and Postgres with a staging environment" \
  "Sprint 1 — Backend & Seam" "backend,P0-blocking" \
"**Risk:** R-04 — No backend exists
**Estimate:** 8 points

There is not a single \`fetch()\` call in 7,600 lines of source. The network boundary is
never crossed. This blocks R-01, R-02, R-03, and R-05.

### Acceptance criteria
- [ ] Stack decision documented (prefer boring: Postgres + a managed host)
- [ ] CRUD endpoints for events and orgs
- [ ] Deployed staging environment reachable from the client
- [ ] Migrations run in CI
- [ ] Health-check endpoint
- [ ] API contract documented (OpenAPI or equivalent)"

issue "Introduce a repository interface between pages and storage" \
  "Sprint 1 — Backend & Seam" "backend,tech-debt,P0-blocking" \
"**Risk:** R-04 — pages import storage modules directly
**Estimate:** 5 points

15 page components import \`listEventRecords\` and friends straight from \`src/data/\`.
Without a seam, swapping localStorage for the API is one high-risk cutover instead of a
page-by-page migration — and the data layer stays untestable.

### Acceptance criteria
- [ ] \`EventRepository\`, \`AttendanceRepository\`, \`UserRepository\` interfaces defined
- [ ] Two implementations: \`HttpRepository\` and \`LocalStorageRepository\`
- [ ] Selected via config/env; localStorage remains the offline and test adapter
- [ ] No page component imports from \`src/data/\` directly
- [ ] Repository interfaces have unit tests against the localStorage adapter"

issue "Move authentication server-side with hashed passwords" \
  "Sprint 1 — Backend & Seam" "backend,security,P0-blocking" \
"**Risks:** R-03 (plaintext passwords) and R-05 (bypassable authorization)
**Estimate:** 5 points

\`AppUser.password\` is serialized in plaintext into \`localStorage['flyer_db_v1']\`
(appDatabase.ts:12) and compared with \`===\` at line 179. Every account's credentials are
one DevTools panel away. Separately, pasting
\`localStorage.setItem('flyerrr_auth','{\"isLoggedIn\":true,\"role\":\"org_officer\"}')\`
into the console grants full officer privileges.

### Acceptance criteria
- [ ] Passwords hashed with bcrypt or argon2, server-side only
- [ ] No credential is ever written to client storage
- [ ] Session tokens are httpOnly cookies or short-lived JWTs
- [ ] Every privileged endpoint enforces role server-side
- [ ] Editing localStorage cannot grant officer access — verified by test
- [ ] Existing seed accounts migrated or reset"

issue "Migrate the events feed to TanStack Query behind the repository" \
  "Sprint 1 — Backend & Seam" "backend,tech-debt,P1-high" \
"**Risk:** R-19 — TanStack Query mounted with zero queries
**Estimate:** 5 points

\`QueryClientProvider\` is mounted at \`App.tsx:54\` but no query has ever been written;
pages fetch synchronously during render. Adopting it during the API migration is free;
retrofitting later is a rewrite.

### Acceptance criteria
- [ ] \`useEvents\`, \`useEvent(id)\`, \`useCreateEvent\` hooks
- [ ] Index, Explore, EventDetail, and Saved consume the hooks
- [ ] Loading and error states rendered (no more synchronous reads in render)
- [ ] Cache invalidated on event creation — replaces the \`location.key\` refetch hack in Index.tsx:23
- [ ] Officer-created events appear in the feed without a manual refresh"

# ============================== SPRINT 2 ====================================
issue "Server-issued, HMAC-signed, single-use check-in tokens" \
  "Sprint 2 — Core Loop" "backend,security,P0-blocking" \
"**Risks:** R-01 (cross-device check-in impossible) and R-06 (forgeable tokens)
**Estimate:** 8 points

Two defects, one fix. (1) \`checkInStore.ts:86\` writes tokens to the **student's**
localStorage; \`validateCheckInToken\` reads the **officer's**. Different stores — the
lookup always fails. (2) \`encodePayload = btoa(JSON.stringify(payload))\` — base64 is an
encoding, not a signature. Any student can decode a token, edit \`eventId\` or
\`expiresAt\`, and re-encode it.

### Acceptance criteria
- [ ] Tokens issued by the server, HMAC-signed with a server-held secret
- [ ] Server-side validation endpoint; nonces stored in the database
- [ ] Single-use enforced server-side; TTL enforced against server time
- [ ] A tampered or replayed token is rejected — covered by tests
- [ ] **Student on device A, officer on device B: check-in succeeds**"

issue "Persist an AttendanceRecord on every validated check-in" \
  "Sprint 2 — Core Loop" "backend,P0-blocking" \
"**Risk:** R-02 — attendance is never recorded
**Estimate:** 5 points

\`TapIn.tsx:33-42\` validates the token, shows a toast, and returns **without writing
anything**. No code path anywhere appends to \`db.attendance\`; the field is seeded at
\`appDatabase.ts:81\` and never read or mutated again.

### Acceptance criteria
- [ ] Successful validation writes an attendance row (event, attendee, timestamp, points)
- [ ] Duplicate check-ins for the same student+event are rejected
- [ ] Points awarded per the event's configured value
- [ ] Officer sees live confirmation reflecting a real persisted record
- [ ] Integration test covers issue -> scan -> persist"

issue "Rewire Reports, History, Rewards, and Resume Builder to live data" \
  "Sprint 2 — Core Loop" "backend,P0-blocking" \
"**Risk:** R-02 — four screens display hardcoded arrays
**Estimate:** 5 points

- \`AttendanceReports.tsx:9\` imports the **static** \`attendanceRecords\` array
- \`AttendanceHistory.tsx:4-10\` keeps a **fourth, separate** hardcoded array
- \`RewardsPerks.tsx:35\` hardcodes \`450\` total points and 8 fixed badges
- \`ResumeBuilder.tsx:32\` — \`handleSave()\` sets \`editing=false\` and fires a toast

### Acceptance criteria
- [ ] All four screens read attendance from the API
- [ ] Points totals computed from real records
- [ ] Badge criteria evaluated against real attendance
- [ ] Resume campus-involvement section generated from real attendance
- [ ] Resume Builder edits persist across reload
- [ ] CSV export reflects live data
- [ ] Empty states render correctly for a brand-new user"

issue "Persist saves/bookmarks and point Explore at the database" \
  "Sprint 2 — Core Loop" "P1-high,tech-debt" \
"**Risk:** R-10 — broken features shipped as if complete
**Estimate:** 3 points

- **Saved page is permanently empty:** \`Saved.tsx:8\` filters \`mockEvents.filter(e => e.saved)\`; \`saved\` is false on all 9 seed events, and \`EventCard.tsx:66\` only calls \`setSaved()\` — component state, never persisted.
- **Explore cannot find officer-created events:** \`Explore.tsx:4\` searches \`mockEvents\`, not \`listEventRecords()\`.

### Acceptance criteria
- [ ] Bookmarking persists server-side, per user
- [ ] Saved page lists actually-saved events and survives reload
- [ ] Explore searches live event data
- [ ] An event created by an officer is immediately searchable
- [ ] Likes either persist or the affordance is removed"

issue "Persist organization verification decisions" \
  "Sprint 2 — Core Loop" "backend,P1-high" \
"**Risk:** R-10 — verification approvals do not persist
**Estimate:** 2 points

\`OrganizationVerificationQueue.tsx:18\` holds the queue in local \`useState\`; approvals
vanish on refresh. \`db.verifications\` is seeded and never used.

### Acceptance criteria
- [ ] Queue reads from the API
- [ ] Approve/reject persists and survives reload
- [ ] Approving an org sets \`verified: true\` on its profile
- [ ] Only authenticated officers can act — enforced server-side
- [ ] Decisions are audit-logged with actor and timestamp"

# ============================== SPRINT 3 ====================================
issue "Unit-test the data layer to >= 60% coverage" \
  "Sprint 3 — Hardening" "testing,P1-high" \
"**Risk:** R-08 — effectively zero test coverage
**Estimate:** 8 points

\`src/test/example.test.ts\` is the only test file and its single assertion is
\`expect(true).toBe(true)\`. ~7,600 lines have no meaningful coverage. The data layer is
pure and is the cheapest place to start.

### Acceptance criteria
- [ ] The tautological example test is deleted
- [ ] Repository implementations covered
- [ ] Token issue/validate/expire/replay paths covered
- [ ] \`getAttendanceSummary\` and \`buildAttendanceCsv\` covered incl. CSV quote escaping
- [ ] Auth flows covered
- [ ] >= 60% line coverage on \`src/data/\`, enforced in CI"

issue "E2E: login through check-in through points awarded" \
  "Sprint 3 — Hardening" "testing,P1-high" \
"**Risk:** R-08 — no integration coverage of the core loop
**Estimate:** 5 points

### Acceptance criteria
- [ ] Student signs up, signs in, browses the feed
- [ ] Student RSVPs and sees the event in reminders
- [ ] Officer creates an event; it appears in the student feed
- [ ] **Two browser contexts:** student presents a code, officer validates it
- [ ] Student's points increase and attendance history updates
- [ ] Suite runs in CI on every PR"

issue "Enable TypeScript strict mode and strictNullChecks" \
  "Sprint 3 — Hardening" "tech-debt,P2-cleanup" \
"**Risk:** R-17 — TypeScript safety is switched off
**Estimate:** 5 points

\`tsconfig.app.json\` sets \`strict: false\`, \`noImplicitAny: false\`,
\`noUnusedLocals: false\`; \`tsconfig.json\` adds \`strictNullChecks: false\`. ESLint
disables \`@typescript-eslint/no-unused-vars\`. A passing \`tsc --noEmit\` proves very
little — null-dereference bugs like R-07 sail through.

### Acceptance criteria
- [ ] \`strict: true\` and \`strictNullChecks: true\`
- [ ] \`noUnusedLocals\` and \`noUnusedParameters\` enabled
- [ ] \`@typescript-eslint/no-unused-vars\` re-enabled as an error
- [ ] \`tsc --noEmit\` passes with zero errors
- [ ] Migrated incrementally by directory, one PR per directory"

issue "Route-level code splitting to get initial JS under 250 KB" \
  "Sprint 3 — Hardening" "tech-debt,P2-cleanup" \
"**Risk:** R-16 — 545 KB single-chunk bundle
**Estimate:** 2 points

\`vite build\` emits \`index-C75k-m_u.js  544.69 kB (167.70 kB gzip)\` with Vite's own
>500 kB warning. All 14 routes are eagerly imported in App.tsx. Wrong default for a
mobile-first campus app on university Wi-Fi.

### Acceptance criteria
- [ ] Routes loaded with \`React.lazy()\` + \`Suspense\`
- [ ] \`manualChunks\` separates vendor code
- [ ] Initial JS chunk < 250 kB
- [ ] No Vite chunk-size warning
- [ ] Route transitions show a loading state"

issue "Remove lovable-tagger and hold a data-layer code-reading session" \
  "Sprint 3 — Hardening" "process,tech-debt,P2-cleanup" \
"**Risk:** R-18 — vendor coupling and unproven code ownership
**Estimate:** 2 points

\`lovable-tagger\` sits in the Vite plugin chain (vite.config.ts:4,15).
\`gpt-engineer-app[bot]\` authored **11 of 26 commits (42%)** — the team owns a large body
of code it did not write.

### Acceptance criteria
- [ ] \`lovable-tagger\` removed from vite.config.ts and package.json
- [ ] Build still succeeds
- [ ] Team session walking \`src/data/\` and \`src/contexts/\` line by line
- [ ] Each module has a named owner recorded in the README
- [ ] PRs touching those directories require that owner's review"

issue "Unify localStorage key naming and add schema versioning" \
  "Sprint 3 — Hardening" "tech-debt,P2-cleanup" \
"**Risk:** R-15 / §2.3 — 7 keys across 2 naming conventions
**Estimate:** 2 points

\`flyer_db_v1\`, \`flyer_rsvp_v1\`, \`flyer_reminders_v1\`, \`flyer_checkin_tokens_v1\`
versus \`flyerrr_auth\`, \`flyerrr_follows\`, \`flyerrr_theme\`. Relevant even after the
API lands, because localStorage remains the offline adapter.

### Acceptance criteria
- [ ] One prefix and one convention across all keys
- [ ] All keys carry a schema version
- [ ] Migration handles data written under the old keys
- [ ] Keys are centralized in one constants module"

issue "Adopt react-hook-form and zod validation on all forms" \
  "Sprint 3 — Hardening" "tech-debt,P2-cleanup" \
"**Risk:** R-19 — installed but unused architectural investments
**Estimate:** 3 points

\`react-hook-form\` 7.61 and \`zod\` 3.25 are dependencies, but \`Login.tsx\` and
\`CreateEvent.tsx\` use raw \`useState\` with no validation beyond the \`required\` attribute.

### Acceptance criteria
- [ ] Login and CreateEvent use react-hook-form with zod resolvers
- [ ] University-email format validated
- [ ] Password strength enforced
- [ ] Event capacity and date validated (no events in the past)
- [ ] Field-level error messages rendered
- [ ] Client schemas shared with or mirrored by server validation"

issue "Add empty, loading, and error states across all screens" \
  "Sprint 3 — Hardening" "P2-cleanup" \
"**Risk:** follow-on from R-02 and R-10 — screens assume data always exists
**Estimate:** 3 points

With real data, a brand-new user sees zero events, zero attendance, and zero points.
Today's screens are written as if seed data is always present.

### Acceptance criteria
- [ ] Every list screen has a designed empty state
- [ ] Every async screen has a loading skeleton
- [ ] Every async screen has an error state with retry
- [ ] Verified by walking the app as a freshly created account"

issue "Accessibility pass: keyboard navigation, labels, contrast" \
  "Sprint 3 — Hardening" "P2-cleanup" \
"**Risk:** not yet audited — carried as a known unknown
**Estimate:** 3 points

Several interactive elements are bare \`<button>\` or \`<div>\` elements with icon-only
content. The QR display renders a decorative grid with no text alternative.

### Acceptance criteria
- [ ] All icon-only buttons have accessible names
- [ ] Full keyboard navigation with visible focus indicators
- [ ] Color contrast meets WCAG AA in light and dark themes
- [ ] Axe or Lighthouse accessibility score >= 90
- [ ] QR code has a text alternative"

issue "Replace the simulated NFC button or scope real Web NFC" \
  "Sprint 3 — Hardening" "P2-cleanup" \
"**Risk:** R-10 — simulated functionality presented as real
**Estimate:** 2 points

\`TapIn.tsx:130\` renders a \"Simulate NFC Tap\" button that fires a success message with
no underlying mechanism. Real Web NFC is Chrome-on-Android only and cannot carry an iOS
demo — yet the UI says *\"Hold your iPhone near the reader.\"*

**Decision required before starting.** Recommendation: make the QR path work first
(#R-01); revisit NFC only if Sprint 2 finishes early.

### Acceptance criteria
- [ ] Team decides: implement Web NFC, or remove the simulation
- [ ] If removed, QR becomes the primary documented path and iPhone copy is corrected
- [ ] If implemented, feature-detected with a graceful QR fallback
- [ ] No UI claims a capability the app does not have"

issue "Document the architecture decision record for the backend stack" \
  "Sprint 1 — Backend & Seam" "process,backend,P1-high" \
"**Risk:** R-04 — backend is new scope for the team
**Estimate:** 2 points

The stack choice is the highest-leverage decision of the semester and needs to be written
down, not absorbed. Timebox to Week 2.

### Acceptance criteria
- [ ] \`docs/adr/0001-backend-stack.md\` recording context, options, decision, consequences
- [ ] At least 3 options evaluated against team skill, hosting cost, and time budget
- [ ] Decision made by end of Week 2 and agreed by all four members
- [ ] Chosen stack is boring and well-documented over novel"

# ---------------------------------------------------------------- summary ----
echo
ok "Done — ${CREATED} issues $($DRY_RUN && echo 'would be created' || echo 'created')."
if [[ -z "$PROJECT_NUMBER" ]] && ! $DRY_RUN; then
  echo
  warn "Issues were NOT added to a Project Board."
  echo "    List your boards:  gh project list --owner $OWNER"
  echo "    Then re-run with:  $0 --project <NUMBER>"
  echo "    Or bulk-add now:"
  echo "      gh issue list --repo $REPO --limit 50 --json url --jq '.[].url' \\"
  echo "        | xargs -I{} gh project item-add <NUMBER> --owner $OWNER --url {}"
fi
