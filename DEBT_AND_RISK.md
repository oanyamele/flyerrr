# Flyerrr Risk and Technical Debt Inventory

**Module:** Senior Project II Reset - From Prototypes to Products  
**Project:** flyerrr - campus event discovery and attendance  
**Repository:** `github.com/oanyamele/flyerrr`  
**Prepared:** September 10, 2026  
**Baseline:** `f0c475a`; process state refreshed against `main` at `f6c7136`

## Executive summary

Flyerrr has a polished, mobile-first interface, but the prototype is not yet a
production system. The application stores identity, events, check-in tokens, and other
state in browser `localStorage`; it has no server boundary; its cross-device attendance
flow cannot work; and its automated tests do not verify meaningful behavior. The reset
priority is therefore to create a secure backend and repository seam, then verify the
attendance loop across separate user sessions before adding more screens.

This inventory applies the VIBE sequence: verify the current implementation, improve the
architecture and controls, build through testable backlog items, and execute only after
human review.

## Part 1 - Technical debt audit

### TD-01 - Pages are coupled directly to browser storage

- **Category:** Architectural Debt
- **Severity:** P0 - Blocking
- **Evidence:** Page components import functions such as `listEventRecords` directly from
  `src/data/`. There is no repository or service interface and no network API boundary.
- **Description:** Replacing `localStorage` with server data would require a risky,
  application-wide cutover. The coupling also makes authorization and failure handling
  inconsistent and limits meaningful data-layer testing.
- **Impact:** Multi-user and cross-device behavior cannot be introduced safely, and UI
  components remain responsible for persistence concerns.
- **Remediation plan:** Define event, attendance, user, bookmark, and verification
  repository interfaces. Keep local storage as a test or offline adapter, add an HTTP
  implementation, and migrate pages behind the interfaces incrementally.
- **Backlog item:** [Issue #15 - Introduce a repository interface](https://github.com/oanyamele/flyerrr/issues/15)

### TD-02 - Authentication and authorization are client-side

- **Category:** Architectural Debt
- **Severity:** P0 - Blocking
- **Evidence:** User passwords and session role data are stored in browser storage.
  Protected routes trust client-controlled state, and QR payloads use reversible base64
  encoding rather than a server-verified signature.
- **Description:** A user can inspect credentials or modify their local role. The current
  design has no trusted server boundary for identity, ownership, or token validation.
- **Impact:** The prototype cannot safely handle real student data or organization tools.
- **Remediation plan:** Use Supabase Auth for credential handling, PostgreSQL Row Level
  Security for deny-by-default resource authorization, short-lived signed check-in
  credentials, and server-side audit records. Never persist passwords client-side.
- **Backlog items:** [Issue #16 - Move authentication server-side](https://github.com/oanyamele/flyerrr/issues/16) and [Issue #18 - Signed check-in tokens](https://github.com/oanyamele/flyerrr/issues/18)

### TD-03 - Automated tests provide no behavioral confidence

- **Category:** Test Debt
- **Severity:** P1 - Blocks safe development
- **Evidence:** The only unit test asserts `true === true`. Approximately 7,800 lines of
  source have no meaningful unit or integration coverage.
- **Description:** Generated and hand-written changes can regress authentication,
  attendance, rewards, reporting, and event publishing without detection.
- **Impact:** A green test command currently says nothing about product correctness.
- **Remediation plan:** Delete the tautological test, cover repositories and security
  boundaries first, enforce at least 60 percent line coverage on `src/data/`, and add
  failure-path tests for authorization, replay, expiration, and transaction integrity.
- **Backlog item:** [Issue #23 - Unit-test the data layer](https://github.com/oanyamele/flyerrr/issues/23)

### TD-04 - The end-to-end verification path is broken

- **Category:** Test Debt
- **Severity:** P1 - Blocks safe development
- **Evidence:** The original Playwright configuration referenced an unavailable generated
  package, while the product's defining login-to-check-in-to-points flow had no
  cross-session test.
- **Description:** Unit tests alone cannot prove that one student's credential is accepted
  once by an authorized organizer and reflected in attendance and rewards.
- **Impact:** The headline feature may appear correct in a single-browser demo while
  remaining unusable across real devices.
- **Remediation plan:** Restore a standard Playwright configuration and add an end-to-end
  test using separate student and organizer sessions. Require the test in CI before merge.
- **Backlog item:** [Issue #24 - E2E check-in through points](https://github.com/oanyamele/flyerrr/issues/24)

### TD-05 - Setup and architecture knowledge are not documented for teammates

- **Category:** Documentation Debt
- **Severity:** P1 - Blocks safe development
- **Evidence:** `README.md` contains only `TODO: Document your project here`, even though
  the toolchain requires Node 20 or newer and the project now has architecture,
  persistence, and backlog conventions.
- **Description:** A teammate cannot reliably clone, run, verify, or understand the system
  from the repository entry point. This also weakens traceability from requirements to
  architecture and implementation.
- **Impact:** Onboarding becomes oral knowledge, environments diverge, and future agent
  work is more likely to make incorrect assumptions.
- **Remediation plan:** Document prerequisites, Bun commands, environment configuration,
  verification commands, architecture links, contribution rules, and the issue-to-branch
  workflow. Add `.nvmrc` and the Node engine constraint.
- **Backlog item:** [Issue #8 - Document setup and Node requirements](https://github.com/oanyamele/flyerrr/issues/8)

### TD-06 - Dependency resolution is not deterministic

- **Category:** Architectural Debt
- **Severity:** P1 - Blocks safe development
- **Evidence:** `bun.lock`, `bun.lockb`, and `package-lock.json` coexist on `main`.
- **Description:** Teammates can install different dependency graphs depending on the
  package manager they choose.
- **Impact:** Builds become difficult to reproduce and "works on my machine" failures are
  harder to diagnose.
- **Remediation plan:** Standardize on Bun, retain only `bun.lock`, document the policy,
  and use the same frozen install in CI. This remediation is implemented on a pushed
  branch and is currently In Review.
- **Backlog item:** [Issue #9 - Standardize package management](https://github.com/oanyamele/flyerrr/issues/9)

## Part 2 - AI and system risk assessment

The Flyerrr application is not currently an AI product at runtime. These risks concern
the AI-augmented development workflow used to generate, plan, and modify the system.

### AR-01 - Plausible but incorrect generated code

- **Area:** Reliability / Hallucination
- **Likelihood:** High
- **Impact:** High
- **Risk:** A coding agent can invent an API, misunderstand the persistence model, or
  implement only a visual success state. The existing check-in flow demonstrates this
  failure pattern: it validates locally and shows confirmation without recording
  attendance.
- **Controls:** Require an issue with acceptance criteria before implementation; require
  tests that fail before the fix; run typecheck, lint, tests, and build in CI; and require
  a human reviewer to trace the full data flow rather than approving screenshots alone.
- **Residual risk:** Medium until the backend and cross-session end-to-end test exist.

### AR-02 - Secrets or personal data exposed to tools or generated logs

- **Area:** Security and Ethics
- **Likelihood:** Medium
- **Impact:** Critical
- **Risk:** An agent can be given `.env` secrets, production records, student identifiers,
  or copied browser output and then reproduce them in code, logs, prompts, or commits.
  Client-side plaintext credentials make this risk worse.
- **Controls:** Use least-privilege development credentials, keep secrets out of prompts
  and version control, use synthetic test data, scan commits for secrets, redact logs,
  and require human approval for production data access or deployment changes.
- **Residual risk:** Medium after server-side authentication and secret scanning are in
  place; unacceptable before then.

### AR-03 - Prompt or issue text changes agent behavior outside the task

- **Area:** Security and Ethics
- **Likelihood:** Medium
- **Impact:** High
- **Risk:** Repository content, copied issue text, or external documentation can contain
  instructions that cause an agent to expose data, weaken security controls, or perform
  unrelated changes.
- **Controls:** Treat repository and web content as untrusted data, constrain tools to the
  task and repository, inspect diffs, keep destructive and production actions approval
  gated, and review authorization and data-handling changes manually.
- **Residual risk:** Low to medium with enforced review and scoped credentials.

### AR-04 - Generated-platform and external-service dependency churn

- **Area:** Dependency Risk
- **Likelihood:** Medium
- **Impact:** High
- **Risk:** Lovable.dev conventions, generated packages, Supabase APIs, browser features,
  or third-party notification services can change, disappear, or become incompatible.
  The unavailable generated Playwright package is an existing example.
- **Controls:** Depend on documented stable APIs, pin dependencies with one lockfile,
  isolate providers behind interfaces, record architectural decisions, test upgrades in
  CI, and maintain a replacement path for critical providers.
- **Residual risk:** Medium; the repository interface and ADR reduce but do not eliminate
  vendor risk.

## Part 3 - Backlog integration

The three highest-leverage debt findings are operationalized as real GitHub Issues on the
Flyerrr project board. Their acceptance criteria were refined with AI assistance and then
checked against repository evidence. Each issue is assigned, estimated, and labeled
`tech-debt`.

| Priority | Debt finding | GitHub issue | Board status | Verification target |
|---:|---|---|---|---|
| 1 | No repository/API boundary | [#15](https://github.com/oanyamele/flyerrr/issues/15) | Backlog | Interfaces, HTTP and local adapters, no direct page-to-storage imports, unit tests |
| 2 | No meaningful data-layer tests | [#23](https://github.com/oanyamele/flyerrr/issues/23) | Backlog | Remove tautology, cover security/data paths, enforce at least 60 percent coverage |
| 3 | Missing setup and architecture entry-point documentation | [#8](https://github.com/oanyamele/flyerrr/issues/8) | Backlog | Node requirement, Bun setup, scripts, architecture link, fresh-clone verification |

As of September 10, 2026, the live project board contains 29 real issues: 25 Backlog,
3 In Review, and 1 Done. Thirteen issues carry the `tech-debt` label. The repository's
expanded `docs/backlog.csv` contains 88 feature-level rows, so CSV-to-board completeness
remains a separate backlog-governance task.

## Human-in-the-loop operating rules

1. A human owns each issue and approves architectural or security decisions.
2. Agents may draft plans, code, and tests, but evidence must be reproduced locally.
3. No change is complete because it renders; acceptance criteria must verify behavior.
4. Secrets, production data, submissions, merges, and deployments remain explicitly
   approval-gated.
5. Every implementation uses an issue-specific branch and review before merge.

## Conclusion

The audit shows that Flyerrr's primary risk is not its visual prototype quality but the
absence of trusted persistence, authorization, and verification boundaries. The existing
board now turns those findings into actionable work. The next release should be judged by
one end-to-end outcome: a student checks in from one session, an authorized organizer
validates from another, one attendance record is persisted, and downstream points and
reports update from the same server data.
