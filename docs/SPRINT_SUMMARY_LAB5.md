# Lab 5 - Agile Sprint Execution (AI-Augmented)

**Project:** Flyerrr campus events application  
**Group:** `oanyamele`, `neaylasimone`, `nadcaesar`, `Brian-Two`  
**Review snapshot:** November 01, 2026, 11:03 PM ET  
**Due:** Monday, November 2, 2026, 11:59 p.m. (course time)  
**Board:** https://github.com/users/oanyamele/projects/1  
**RTM:** https://github.com/oanyamele/flyerrr/blob/codex/lab5-sprint-evidence/docs/RTM.md

## Sprint goal and reporting boundary

Review the implemented accessibility and account/event repository improvements, validate their acceptance evidence, and connect the backlog to an RTM with clear ownership and remaining integration work. This report consolidates existing sprint milestones and implementation evidence from September 29 through October 25, reviewed November 1. The team's original sprint start/end dates, planning commitment, stand-up notes and review attendance were not supplied. This snapshot does not claim that one newly observed, timeboxed sprint cycle has been completed.

## Completed versus incomplete

The board contains 30 assigned issues: 6 Done, 3 In Progress, 21 Backlog. Those are workflow counts, not six fully accepted deliveries. Two AI-assisted implementations have concrete evidence: accessibility (#31 / merged PR #40) and the user/event repository slice (#43 / open PR #42). The latter is implemented and validated on its branch; main integration and team review remain open.

| Item | Owner | Completion evidence | Remaining work |
|---|---|---|---|
| #31 accessibility | neaylasimone | PR #40 merged; keyboard/landmark/label/QR text changes inspected; author-reported Profile Lighthouse 100 | Complete manual light/dark and keyboard audit record; issue checklist is stale |
| #43 user/event repository seam | Brian-Two | PR #42; fresh 12/12 tests, TypeScript and build pass | Review/merge; full #15 still needs HTTP and attendance adapters and remaining page migrations |
| #9 Bun standardization | Brian-Two | PR #35 branch file inspection confirms one lockfile, README and Bun CI | Open PR; integration and fresh frozen install/CI remain |
| #13 relational schema | Brian-Two | Schema design in PR #36 | Four-member sign-off, review and integration |
| #33 backend ADR | Brian-Two | Decision document in PR #37 | Four-member agreement and integration |
| #5 board hygiene | Brian-Two | 30 real assigned issues; 5 new planning/traceability fields | #43 has no estimate/milestone; a formal governance re-audit remains |

The remaining 24 items are incomplete: three in progress (#16, #28, #29), 21 in backlog. PR #39 is auth planning only. PR #38 is a partial Explore implementation and is open with conflicts. No bookmarks, server auth, attendance or backend deployment is claimed complete.

## Responsible AI implementation and verification

**Accessibility, #31 / PR #40:** The author records that AI initially claimed completion; independent Lighthouse testing found Profile at 88, below the issue's 90 threshold. The author directed fixes to accessible names, contrast and the main landmark, then reported 100. Source review confirms keyboard event-card activation, a skip link/main landmark and readable QR token text. Automated Lighthouse covers the Profile page and does not establish full WCAG compliance.

**Repository slice, #43 / PR #42:** Cursor Composer generated repository contracts, adapters, provider, call-site changes and tests. The PR records human corrections to provider memoization, TypeScript union narrowing and React hook order. LocalStorage and in-memory adapters are present; an HTTP adapter was deliberately not claimed because no API exists. Fresh verification at exact head `085f4c5ac0` passed 12 tests, app TypeScript and build. Server-side authorization and password storage remain #16.

**Current review:** Codex collected GitHub evidence, ran validation, added board metadata and generated this RTM/report. AI output was checked against live issue/PR state and source; historical author-reported checks are distinguished from checks rerun now. No teammate approval, meeting, runtime deployment or live-user result is invented.

## Team coordination and ownership

| Member | Assigned issues | Done / In progress / Backlog | Visible contribution / next coordination point |
|---|---|---|---|
| Brian-Two | 9 | 5 / 1 / 3 | PRs #35-#38 and #42; review/integrate current work, finish #29 |
| neaylasimone | 7 | 1 / 0 / 6 | Merged PR #40 and open #41; complete #15 after #43 review |
| nadcaesar | 7 | 0 / 2 / 5 | PR #39 documents #16 plan; implement server auth after API #14 |
| oanyamele | 7 | 0 / 0 / 7 | Open PR #44; API #14 and CI #6 are major enabling work |

Task counts are reasonably distributed, but verified merged delivery is uneven. Commit/PR evidence shows contributions from several members; this is not evidence that all four reviewed every change. Existing assignments are preserved. Technical dependency fields are planning guidance, not claims of team agreement.

## Blockers, sequencing and next-sprint carryover

1. Review #33 ADR and #13 schema with all four members; resolve approvals and integrate PRs #37/#36.
2. API/database #14 enables server auth #16; then secure tokens #18 enable attendance #19 and live reports #20.
3. Review/integrate #43's narrow repository slice before completing #15 and query migration #17. Do not close #15 from #43 alone.
4. Resolve PR #38's main conflict; finish server-side bookmarks and likes under #21.
5. Complete #29 form validation with explicit server parity dependency on #16; finish #28 storage migration.
6. Confirm actual sprint dates/commitment and obtain team review. Record an acceptance decision for every claimed delivery, estimate/schedule #43, and update stale checklists from evidence.

## Validation and evidence limitations

Fresh isolated checks used the installed dependency tree from the existing local checkout (no fresh lockfile install). Main `cf6a1ec0e0` passed 7 tests; PR #42 head `085f4c5ac0` passed 12. Both passed `tsc -p tsconfig.app.json --noEmit` and production build. Each suite includes the pre-existing `expect(true).toBe(true)` example, which is not meaningful feature coverage. Builds retain outdated Browserslist and >500 kB chunk warnings (main 547.20 kB; repository branch 547.85 kB). Full lint, E2E, security, app-wide accessibility and deployment were not verified in this review.

This package contains the sprint summary, the URL to the new issue-based RTM and a readable GitHub board export. It is an evidence-backed review, with the missing sprint-cycle record and acceptance/integration gaps disclosed.
