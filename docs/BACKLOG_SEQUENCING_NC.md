# Backlog sequencing for NC (`nadcaesar`)

**Scope:** the 7 of 30 board items assigned to `nadcaesar`, ordered against the other 23.
**Board snapshot:** 2026-09-22 — 1 Done, 3 In Review, 26 Backlog.
**Total assigned:** 21 story points across all four sprint milestones.

---

## 1. The board as it actually stands

| Owner | Items | Points | Started |
|---|--:|--:|---|
| Brian-Two | 7 | 21 | **4** — 1 Done, 3 In Review |
| oanyamele | 8 | 28 | 0 |
| neaylasimone | 8 | 29 | 0 |
| **nadcaesar** | **7** | **21** | **0** |

Brian owns every item that has moved. Twenty-six of thirty items are untouched, including
all four of the Sprint 1 P0-blocking items that the rest of the semester hangs on.

### Your seven

| # | ID | Title | Sprint | Pts | Priority | Blocked by |
|---|---|---|---|--:|---|---|
| [#8](https://github.com/oanyamele/flyerrr/issues/8) | F4.3 | `.nvmrc`, engines field, real README | 0 | 1 | P1 | *nothing* (soft: #9) |
| [#12](https://github.com/oanyamele/flyerrr/issues/12) | F5.2 | Remove dead code — 3 components, 33 UI files | 0 | 1 | P2 | #9 (lockfile) |
| [#16](https://github.com/oanyamele/flyerrr/issues/16) | F1.5 | Server-side auth with hashed passwords | 1 | 5 | **P0** | #13, #14, #15 |
| [#20](https://github.com/oanyamele/flyerrr/issues/20) | F2.3 | Rewire Reports/History/Rewards/Resume to live data | 2 | 5 | **P0** | #14, #15, #19 |
| [#24](https://github.com/oanyamele/flyerrr/issues/24) | F3.4 | E2E: login → check-in → points | 3 | 5 | P1 | #10, #16, #18, #19, #20 |
| [#28](https://github.com/oanyamele/flyerrr/issues/28) | F5.4 | Unify localStorage keys, add schema versioning | 3 | 2 | P2 | *nothing* (overlaps #15, #16) |
| [#32](https://github.com/oanyamele/flyerrr/issues/32) | F6.3 | Replace simulated NFC, or scope real Web NFC | 3 | 2 | P2 | team decision |

---

## 2. The recommended order

**Not F1.5 first.** F1.5 is your largest, highest-priority item, and it is also the one
most dependent on code nobody has written. Leading with it means two weeks of blocked
waiting followed by a rush. Lead with the two 1-point Sprint 0 items instead, and run
F1.5's unblocked planning phases in parallel with them.

| Order | Item | Why here |
|--:|---|---|
| 1 | **#8** — README, `.nvmrc`, engines | The only item you own that unblocks all three teammates. Zero dependencies. |
| 2 | **#12** — remove dead code | Must land *before* #15 and #17, or you are deleting files other people just refactored. |
| 3 | **#16** — F1.5, server-side auth | P0, on the critical path for Sprint 2. Phases 0–1 start now; Phases 2–3 wait on #14/#15. |
| 4 | **#28** — localStorage key unification | Move it *earlier* than its Sprint 3 slot. Argued below. |
| 5 | **#20** — rewire four screens to live data | Hard-blocked on #19. Nothing to build early; something to *specify* early. |
| 6 | **#24** — E2E core loop | Cannot pass until Sprint 2 closes. Needs #10 fixed first — flag that now. |
| 7 | **#32** — NFC decision | Issue says "decision required before starting." Cheap either way. Raise the decision early, do the work last. |

### 1 · #8 — README, `.nvmrc`, engines · this week

One point, no dependencies, and the only item on your list that makes other people's work
easier. The repo requires Node ≥ 20 (Vite 5, ESLint 9) and documents nothing — the README
literally reads `TODO: Document your project here`, and on Node 16 `npx eslint .` fails
with `ERR_MODULE_NOT_FOUND`. Every teammate who hits that loses an afternoon.

The second reason is about you, not the repo: **you have never had a PR reviewed by this
team.** You do not want to discover that review takes four days while a 5-point P0 sits in
the queue. Spend a 1-point PR learning the turnaround.

Sequencing note: the README must name the chosen package manager, which is Brian's #9
(In Review). Either wait for #9 to merge — days, not weeks — or write the rest and fill
that section last. The CI badge criterion depends on Ogechi's #6; if CI does not exist yet,
say so in the PR rather than blocking on it.

### 2 · #12 — remove dead code · immediately after #9 merges

Three unreferenced components (`EventDetailModal.tsx` 209 lines, `FilterBar.tsx` 52,
`NavLink.tsx` 28) and 33 of 48 unused shadcn/ui components, roughly 2,900 lines with a
Radix dependency each.

**This is more time-sensitive than its P2-cleanup label suggests**, for a reason the issue
body does not mention. Neayla's #15 (repository seam) and Brian's #17 (TanStack Query
migration) will touch a large number of files across `src/`. Deleting 36 files *after* those
land means resolving conflicts in files that are about to be deleted anyway. Deleting them
first makes both of their diffs smaller and their reviews shorter. It also shrinks the
surface of Brian's #25 (TypeScript strict mode) — every file deleted now is a file nobody
has to add null checks to later.

One real dependency: the acceptance criteria require removing `@radix-ui` packages from
`package.json`, which rewrites the lockfile. Brian's #9 deletes two of three competing
lockfiles. **Land #9 first** or you will have a merge conflict in a generated file, which is
the least rewarding conflict there is.

### 3 · #16 — F1.5, server-side auth · Phases 0–1 now, in parallel

Full plan in `docs/F1.5_SERVER_AUTH_PLAN.md`; decisions in `docs/adr/0002-authentication.md`.

This is third in *completion* order but the ADR and API contract should be written this
week, alongside items 1 and 2, because they depend on nothing and because they are what let
you work in parallel with Ogechi's #14 instead of behind it. The dependency structure is
the whole problem: F1.5 needs Brian's schema (#13, In Review), Ogechi's API process (#14,
Backlog, 8 points — the largest item on the board), and Neayla's seam (#15, Backlog).

Everything that makes F1.5 *F1.5* — hashing, sessions, rate limiting, the bypass test — is
testable without a database. So if #14 has not landed by the end of Week 3, build against
an in-memory store behind the repository interface and swap it later. Say this out loud at
standup now, so it reads as de-risking rather than duplicated work when the PR appears.

### 4 · #28 — localStorage keys · argue to move it out of Sprint 3

This is the one place where I would push back on the board's own sequencing.

#28 renames seven localStorage keys spanning two conventions (`flyer_db_v1`,
`flyer_rsvp_v1`, `flyer_reminders_v1`, `flyer_checkin_tokens_v1` versus `flyerrr_auth`,
`flyerrr_follows`, `flyerrr_theme`). But look at what happens to those keys earlier in the
plan: **F1.5 deletes `flyerrr_auth` outright**, and **#15 demotes `flyer_db_v1`** to an
offline adapter. Leaving #28 in Sprint 3 means renaming keys in Sprint 3 that were
rewritten in Sprints 1 and 2 — the same files touched twice, for no benefit.

Concretely: fold the `flyerrr_auth` removal into your F1.5 PR, where it is a deletion
rather than a rename, and do the remaining five keys alongside #15 while Neayla is already
centralizing storage access. Raise this in sprint planning as a proposal, not a unilateral
change — it moves a P2 item into someone else's sprint window.

### 5 · #20 — rewire four screens to live data

Your most dependent item. It needs #14 and #15 for data access and **#19 (Neayla's
attendance persistence) for data to exist at all** — you cannot compute real point totals or
evaluate badge criteria against a table with no rows.

There is nothing to build early, but there is something worth doing: write down what each
of the four screens needs. `AttendanceReports.tsx:9` imports a static array,
`AttendanceHistory.tsx:4-10` keeps a *fourth separate* hardcoded array, `RewardsPerks.tsx:35`
hardcodes 450 points and 8 badges, and `ResumeBuilder.tsx:32`'s `handleSave()` sets
`editing=false` and fires a toast without persisting anything. Turning that into a concrete
list of queries and handing it to Neayla before she finalizes #19 is the difference between
her writing the API you need and you adapting to the API she guessed at.

### 6 · #24 — E2E core loop

Last of the substantial work by necessity: the test asserts a student signs up, signs in,
RSVPs, an officer creates an event, and across **two browser contexts** a check-in awards
points. That requires #16, #18, #19, #20, and #21 to all be complete. It cannot pass before
Sprint 2 closes.

**Raise #10 now.** `playwright.config.ts:1` and `playwright-fixture.ts` both import
`lovable-agent-playwright-config`, which is not in `package.json` and not in `node_modules`
— a hallucinated dependency, which is why Playwright has never executed once in this repo.
Fixing it is Ogechi's #10, a 1-point Sprint 0 item still sitting in Backlog, and it is a
hard prerequisite for your 5-point Sprint 3 item. Do not let a 1-pointer block a 5-pointer
in Week 9.

You can write the spec file early with `test.skip` and real assertions. It costs an hour and
serves as executable documentation of the acceptance criteria.

### 7 · #32 — NFC decision

The issue says outright: *"Decision required before starting. Recommendation: make the QR
path work first; revisit NFC only if Sprint 2 finishes early."* Real Web NFC is
Chrome-on-Android only and cannot carry an iOS demo, while `TapIn.tsx:130` currently renders
a "Simulate NFC Tap" button that fires a success message with no mechanism behind it — under
copy that reads *"Hold your iPhone near the reader."*

Correctly last. But put the decision on a team agenda in Sprint 2, because the honest
outcome is probably "delete the simulation, make QR the documented path, fix the iPhone
copy," which is a 30-minute change — and one the team should choose deliberately rather
than discover in Week 10. A demo that claims a capability it does not have is the kind of
thing that gets noticed in a capstone presentation.

---

## 3. Since you do not own the repository

`oanyamele` owns `flyerrr`, which has three practical consequences.

**None of your seven items need admin rights.** Everything you own lives in `src/`, `docs/`,
and a new `server/` directory. You are not blocked on permissions — only on other people's
code. Worth knowing, because it means the mitigation is communication, not escalation.

**You cannot merge your own work, and that will get slower.** Neayla's #11 enables branch
protection requiring one approving review plus a passing CI check. She may not have admin
either — only Ogechi does — so that item may need reassigning. Once it lands, every PR of
yours needs a named reviewer. Two consequences: get your cheap PRs through the pipe early,
and ask now who reviews your work by default. `src/data/` and `src/contexts/` are exactly
the directories Brian's #27 wants to put under CODEOWNERS, and both are directories F1.5
rewrites.

**You are exposed to a dependency you cannot control.** Fifteen of your 21 points sit behind
Ogechi's #14, the single largest item on the board, still in Backlog with nothing started.
If #14 slips, #16, #20, and #24 all slip — three of your seven items, and both of your P0s.
That is a concentration risk to raise at standup with the in-memory-store fallback attached,
not something to absorb quietly and explain in Week 10.

## 4. This week, concretely

1. Open the PR for **#8**. Leave the package-manager line pending on #9.
2. Post the four coordination comments from `docs/F1.5_COORDINATION_COMMENTS.md`.
3. Open a draft PR with `docs/adr/0002-authentication.md` so review starts before code exists.
4. Update **#16** with the corrected line reference (`appDatabase.ts:187`, not `:179`) and the
   self-signup privilege-escalation evidence.
5. Ask Ogechi for a date on **#10**, and tell him why a 1-point item is on your critical path.
6. Propose moving **#28** out of Sprint 3 at the next planning meeting.
