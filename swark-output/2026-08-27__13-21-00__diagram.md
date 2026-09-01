# flyerrr — System Architecture Baseline

> Generated for **Deliverable 1: Project Reset & Architecture Baseline**
> Repository: `oanyamele/flyerrr` · Branch `main` @ `f0c475a` · Audited 2026-08-27
> Diagrams are Mermaid and render natively on GitHub.

---

## 1. Current System Architecture (as built)

Every box below is a file that exists in the repo today. There is **no server tier** — the
"database" is a JSON blob in the browser's `localStorage`.

```mermaid
graph TD
    subgraph BROWSER["🌐 Browser — the entire system runs here"]

        subgraph SHELL["Application Shell — src/App.tsx"]
            QC["QueryClientProvider<br/><i>TanStack Query — installed, zero queries</i>"]
            RT["BrowserRouter<br/>14 routes, all eagerly imported"]
            GUARD["ProtectedRoutes<br/><b>client-side auth guard</b>"]
        end

        subgraph CTX["State Layer — src/contexts/"]
            AUTH["AuthContext<br/>isLoggedIn · role · userId"]
            FOLLOW["FollowContext<br/>followedOrgIds[]"]
            THEME["ThemeContext<br/>light / dark"]
        end

        subgraph PAGES["Route Components — src/pages/ (15)"]
            direction LR
            P1["Login"]
            P2["Index — feed"]
            P3["EventDetail"]
            P4["TapIn — check-in"]
            P5["CreateEvent"]
            P6["Explore · Saved · Profile"]
            P7["AttendanceReports<br/>AttendanceHistory<br/>RewardsPerks · ResumeBuilder"]
            P8["OrgVerificationQueue<br/>NotificationSettings<br/>EventReminders"]
        end

        subgraph COMP["Presentation — src/components/"]
            SHARED["EventCard · BottomNav<br/>CategoryFilter · WeeklyDigest"]
            DEAD["EventDetailModal · FilterBar · NavLink<br/><i>0 references — dead code</i>"]
            UIKIT["shadcn/ui + Radix<br/>48 components · 33 unused"]
        end

        subgraph DATA["Data Access — src/data/"]
            APPDB["appDatabase.ts<br/>getDatabase · createUser<br/>authenticateUser · createEventRecord"]
            CHECKIN["checkInStore.ts<br/>RSVP · reminders · QR tokens"]
            ATTEND["attendanceStore.ts<br/><b>static array + CSV builder</b>"]
            SEED["mockEvents.ts<br/>9 seed events · 5 seed orgs"]
        end

        subgraph LS["Persistence — window.localStorage (7 keys, 2 naming conventions)"]
            K1["flyer_db_v1"]
            K2["flyer_rsvp_v1"]
            K3["flyer_reminders_v1"]
            K4["flyer_checkin_tokens_v1"]
            K5["flyerrr_auth"]
            K6["flyerrr_follows"]
            K7["flyerrr_theme"]
        end
    end

    NOBACK["☁️ Backend / API / Database<br/><b>DOES NOT EXIST</b><br/>zero fetch() calls in the codebase"]

    QC --> RT --> GUARD --> PAGES
    GUARD -.reads.-> AUTH
    PAGES --> COMP
    PAGES --> CTX
    PAGES --> DATA
    SHARED --> UIKIT
    APPDB --> K1
    APPDB --> SEED
    APPDB --> ATTEND
    CHECKIN --> K2
    CHECKIN --> K3
    CHECKIN --> K4
    AUTH --> K5
    FOLLOW --> K6
    THEME --> K7
    BROWSER -. "no network boundary is ever crossed" .-> NOBACK

    classDef broken fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d
    classDef missing fill:#fef3c7,stroke:#d97706,stroke-width:2px,stroke-dasharray:5 5,color:#78350f
    classDef store fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
    class DEAD,ATTEND broken
    class NOBACK missing
    class K1,K2,K3,K4,K5,K6,K7 store
```

### Dependency direction

`pages → contexts → localStorage` and `pages → data → localStorage`. There is no
service/repository abstraction between a route component and the storage engine, so
swapping `localStorage` for a real API in Senior Project II means editing every page
that touches data.

---

## 2. Data Flow — the check-in loop, and where it breaks

This is the app's core value proposition (*attend → check in → earn points → build resume*).
Tracing it end-to-end reveals **three severed links**.

```mermaid
sequenceDiagram
    autonumber
    actor S as 📱 Student device
    participant SD as Student localStorage
    participant OD as Officer localStorage
    actor O as 💻 Officer device
    participant R as AttendanceReports page

    Note over S,SD: Student opens backup QR (EventDetail / TapIn)
    S->>SD: issueDynamicCheckInToken(eventId, userId)
    SD-->>S: btoa(JSON) token, 20s TTL

    Note over S,O: Officer scans the student's screen
    O->>OD: validateCheckInToken(token)
    OD-->>O: ❌ "QR code not recognized"

    rect rgba(220,38,38,0.10)
    Note over SD,OD: 🔴 BREAK 1 — tokens are written to the STUDENT's localStorage.<br/>The officer's browser has a different, isolated store.<br/>Cross-device check-in is impossible by construction.
    end

    rect rgba(220,38,38,0.10)
    Note over O,R: 🔴 BREAK 2 — even on a successful validation,<br/>TapIn.handleScannerSubmit() only fires a toast.<br/>No AttendanceRecord is ever written. db.attendance is<br/>seeded once and never read or mutated again.
    end

    R->>R: import { attendanceRecords } from attendanceStore
    R-->>O: Always the same 5 hardcoded rows

    rect rgba(220,38,38,0.10)
    Note over R: 🔴 BREAK 3 — reports read the STATIC seed array,<br/>not the database. AttendanceHistory keeps a fourth,<br/>separate hardcoded list. RewardsPerks hardcodes "450 points".
    end
```

**Consequence:** every attendance, points, badge and resume number in the product is
cosmetic. No user action anywhere in the app can change them.

---

## 3. Persistence Topology — what actually survives a refresh

```mermaid
graph LR
    subgraph WRITE["✍️ Writes that persist"]
        W1["Sign up / Sign in<br/>→ flyer_db_v1.users"]
        W2["Create event (officer)<br/>→ flyer_db_v1.events"]
        W3["Follow an org<br/>→ flyerrr_follows"]
        W4["Theme toggle<br/>→ flyerrr_theme"]
        W5["RSVP + reminder<br/>→ flyer_rsvp_v1"]
    end

    subgraph LOST["🕳️ Writes that vanish on refresh"]
        L1["Bookmark / Save an event<br/><i>EventCard useState only</i>"]
        L2["Like an event<br/><i>useState only</i>"]
        L3["Approve / reject org verification<br/><i>local state; db.verifications unused</i>"]
        L4["Resume Builder fields<br/><i>useState + toast, no write</i>"]
        L5["Check-in / attendance<br/><i>no write path exists</i>"]
    end

    subgraph STALE["🧊 Screens pinned to seed data"]
        T1["Saved.tsx → mockEvents.filter(saved)<br/><i>always empty; nothing sets saved=true</i>"]
        T2["Explore.tsx → mockEvents<br/><i>officer-created events never searchable</i>"]
        T3["AttendanceReports → static array"]
        T4["AttendanceHistory → own hardcoded array"]
        T5["RewardsPerks → hardcoded badges"]
    end

    classDef ok fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef bad fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef warn fill:#fef3c7,stroke:#d97706,color:#78350f
    class W1,W2,W3,W4,W5 ok
    class L1,L2,L3,L4,L5 bad
    class T1,T2,T3,T4,T5 warn
```

---

## 4. Target Architecture for Senior Project II

The minimum change that makes the product real: introduce a server tier and a
repository seam so pages stop importing storage directly.

```mermaid
graph TD
    subgraph CLIENT["React client (largely reusable as-is)"]
        PG["Pages"]
        HOOKS["TanStack Query hooks<br/><i>useEvents · useCheckIn · useAttendance</i>"]
        REPO["Repository interface<br/><b>the new seam</b>"]
    end

    subgraph SERVER["Backend service — to be built"]
        API["REST / RPC API"]
        AUTHZ["Server-side authz<br/>role checks on every route"]
        SIGN["Signed, single-use check-in tokens<br/>HMAC + server-held nonce"]
    end

    DB[("Postgres<br/>users · orgs · events<br/>rsvps · attendance · verifications")]

    PG --> HOOKS --> REPO
    REPO -->|"HTTP"| API
    API --> AUTHZ --> DB
    API --> SIGN --> DB
    REPO -.->|"swappable for tests / offline"| LOCAL["localStorage adapter<br/><i>today's code, demoted to a fallback</i>"]

    classDef new fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a
    class API,AUTHZ,SIGN,DB,REPO,HOOKS new
```

**Why the seam first:** today 15 page components each `import { listEventRecords }` and
friends directly. Introducing `REPO` before the backend lets the team migrate page-by-page
instead of in one high-risk cutover, and makes the data layer testable — which is what
unblocks the 0% test coverage problem.

---

## 5. Technology Inventory

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Build | Vite + `@vitejs/plugin-react-swc` | 5.4.19 | Requires Node ≥ 20; no `.nvmrc` in repo |
| Language | TypeScript | 5.8.3 | `strict: false`, `strictNullChecks: false` |
| UI | React | 18.3.1 | |
| Routing | react-router-dom | 6.30.1 | 14 routes, no lazy loading |
| Styling | Tailwind CSS | 3.4.17 | HSL token system, light + dark |
| Components | shadcn/ui + Radix | 48 files | 33 unused |
| Server state | TanStack Query | 5.83.0 | Provider mounted, **zero queries written** |
| Animation | framer-motion | 11.0.0 | |
| Forms | react-hook-form + zod | 7.61 / 3.25 | Installed; Login/CreateEvent use raw `useState` |
| Unit test | Vitest + Testing Library | 3.2.4 | 1 tautological test |
| E2E | Playwright | 1.57 | **Config imports an uninstalled package** |
| Codegen | `lovable-tagger` | 1.1.13 | Vendor coupling in the build pipeline |
| Backend | — | — | **None** |
