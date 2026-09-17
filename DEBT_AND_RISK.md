# Risk & Technical Debt Register

## Audit Analysis & Remediation Strategy

* **P0 (Blocking):** Critical architectural gaps preventing core product functionality.  
* **P1 (Safe Development):** Security vulnerabilities, testing gaps, and broken workflows blocking delivery.  
* **P2 (Compounding Cleanup):** Code hygiene, bundle size, and architectural debt incurring long-term maintenance costs.

&nbsp;

# P0 — Blocking

## R-01: Cross-device check-in is architecturally impossible:

**Evidence:** src/data/checkInStore.ts:86-101 writes issued tokens to localStorage\['flyer\_checkin\_tokens\_v1'\]. validateCheckInToken() at line 103 reads that same key. The student issues the token on their device; the officer validates on theirs. Two isolated stores — the lookup returns "QR code not recognized." 100% of the time.&nbsp;

**Fix:** Server-issued, HMAC-signed, single-use tokens validated by an API endpoint. Depends on R-04.

## R-02: Attendance is never recorded — the entire rewards chain is decorative:

**Evidence:** src/pages/TapIn.tsx:33-42 — handleScannerSubmit() validates the token, sets confirmation text, fires a toast, and returns without writing anything. No code path anywhere appends to db.attendance; the field is seeded at appDatabase.ts:81 and never read or mutated again.&nbsp;

**Fix:** Persist attendance records to the backend database upon successful validation and trigger rewards processing asynchronously.

## R-03: Passwords stored in plaintext, readable from DevTools :

**Evidence:** AppUser.password: string (appDatabase.ts:12) is serialized straight into localStorage\['flyer\_db\_v1'\]; authenticateUser() at line 179 compares user.password \=== input.password.&nbsp;

**Fix:** Move authentication server-side; hash with bcrypt or argon2; never persist credentials client-side.

## R-04: No backend exists:

**Evidence:** Zero matches for fetch(, axios, supabase, or firebase across src/. The network boundary is never crossed.&nbsp;

**Fix:** Stand up an API and Postgres. This is the defining scope of Senior Project II.

# P1 — Blocks Safe Development

## R-05: Authorization is client-side only and trivially bypassable:

**Evidence:** App.tsx:29-31 — ProtectedRoutes renders based on auth.isLoggedIn, read from localStorage\['flyerrr\_auth'\]. Pasting into console grants full officer privileges: localStorage.setItem('flyerrr\_auth','{"isLoggedIn":true,"role":"org\_officer"}').&nbsp;

**Fix:** Server-side session validation and per-route role enforcement.

## R-06: QR anti-fraud measures are cosmetic

**Evidence:** checkInStore.ts:78 — encodePayload \= btoa(JSON.stringify(payload)). Base64 is an encoding, not a signature. Any student can decode a token, edit eventId, userId, or expiresAt, and re-encode it.&nbsp;

**Fix:** HMAC-sign server-side; verify server-side; store nonces in the database.

## R-07: React hooks called conditionally — crash risk

**Evidence:** src/pages/EventDetail.tsx:26-32 returns early when \!event, but two useEffect calls follow at lines 38 and 43\. ESLint reports two react-hooks/rules-of-hooks errors.&nbsp;

**Fix:** Move early returns below all Hook calls or extract early returning state logic into subcomponents.

## R-08: Effectively zero test coverage

**Evidence:** src/test/example.test.ts is the only test file, and its single assertion is expect(true).toBe(true). \~7,600 lines of source have no meaningful coverage.&nbsp;

**Fix:** Add missing test dependencies; unit-test data layer first; add E2E tests for core flows (login → RSVP → check-in).

## R-09: No CI, no branch protection

### **Evidence:** No .github/ directory. actions/workflows → total\_count: 0\. branches/main/protection → 404\. Four PRs have been merged with no automated verification.&nbsp;

### **Fix:** Add GitHub Actions running install → typecheck → lint → test → build on every PR and require checks to pass before merging.

## R-10: Broken features shipped as if complete

**Evidence:** Saved page relies on unpersisted component state; Explore searches hardcoded mocks instead of dynamic records; Verification approvals and Resume Builder use local useState without persistence.

&nbsp;**Fix:** Connect all feature components to persistent storage and unified state management.

## R-11: Three competing lockfiles

**Evidence:** bun.lock, bun.lockb, and package-lock.json are all committed. **Fix:** Standardize on a single package manager (e.g., npm or bun), delete redundant lockfiles, and document usage.

## R-12: Node version requirement is undocumented and unmet

**Evidence:** The repo requires Node ≥ 20\. Defaulting to older versions causes tooling failures with ERR\_MODULE\_NOT\_FOUND and EBADENGINE warnings. No .nvmrc or engines field exists.&nbsp;

**Fix:** Add .nvmrc specifying Node version and add engines block to package.json.

## R-13: Eleven dependency vulnerabilities, ten of them high:

**Evidence:** npm audit \--production reports 11 vulnerabilities, including PostCSS path-traversal and yaml stack overflow advisories.&nbsp;

**Fix:** Run npm audit fix and update vulnerable dependencies.

# P2 — Compounding Cleanup

## R-14: Event dates are display strings, not timestamps:

**Evidence:** mockEvents.ts:62 — date: "Fri, Sep 12", time: "6:00 PM". There is no machine-readable date anywhere in the schema.&nbsp;

**Fix:** Refactor event schema to use ISO-8601 UTC timestamps before backend migration.

## R-15: Substantial dead code:

* **Evidence:** EventDetailModal.tsx, FilterBar.tsx, and NavLink.tsx have zero imports (289 lines). 33 unused shadcn/ui components add \~2,900 lines.&nbsp;  
* **Fix:** Remove unused components and unreferenced UI dependencies.

## R-16: 545 KB single-chunk bundle:

**Evidence:** vite build outputs a single 544.69 kB JS chunk because all 14 routes are eagerly imported in App.tsx.&nbsp;

**Fix:** Implement React.lazy dynamic imports for route-level code splitting.

## R-17: TypeScript safety is switched off:

**Evidence:** tsconfig.app.json and tsconfig.json set strict, noImplicitAny, and strictNullChecks to false.&nbsp;

**Fix:** Enable strict mode options in tsconfig and fix resulting type errors across codebase.

## R-18: Vendor coupling to Lovable.dev:

**Evidence:** lovable-tagger plugin present in Vite config; automated bot accounts authored 42% of commits.&nbsp;

**Fix:** Remove tagger plugin once codegen finishes; conduct team code review across core data modules.

## R-19: Unused architectural investments:

**Evidence:** QueryClientProvider, react-hook-form, and zod are mounted/installed but completely unused in core form flows.&nbsp;

**Fix:** Integrate React Query and React Hook Form with Zod validation during backend API migration.

&nbsp;

&nbsp;

| Severity Priority | Findings Count | Effort Estimate |
| :---- | ----: | ----: |
| **P0** · Critical / Blocking | 4 | 34 pts |
| **P1** · Blocks Safe Development | 9 | 30 pts |
| **P2** · Compounding Technical Debt | 6 | 17 pts |
| **Total Assessment** | **19** | **81 pts** |

&nbsp;