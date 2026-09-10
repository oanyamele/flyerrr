#!/usr/bin/env python3
"""Build the two Senior Project II PDF submissions from the verified audit."""

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#14213D")
BLUE = colors.HexColor("#2563EB")
SKY = colors.HexColor("#DBEAFE")
TEAL = colors.HexColor("#0F766E")
MINT = colors.HexColor("#CCFBF1")
RED = colors.HexColor("#B91C1C")
ROSE = colors.HexColor("#FEE2E2")
AMBER = colors.HexColor("#B45309")
GOLD = colors.HexColor("#FEF3C7")
SLATE = colors.HexColor("#475569")
LIGHT = colors.HexColor("#F8FAFC")
LINE = colors.HexColor("#CBD5E1")
WHITE = colors.white


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=29,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=14,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=SLATE,
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=NAVY,
            spaceBefore=8,
            spaceAfter=9,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=BLUE,
            spaceBefore=8,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.3,
            leading=13.2,
            textColor=NAVY,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.6,
            leading=10.2,
            textColor=NAVY,
        ),
        "tiny": ParagraphStyle(
            "Tiny",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=6.8,
            leading=8.8,
            textColor=NAVY,
        ),
        "callout": ParagraphStyle(
            "Callout",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=14,
            textColor=NAVY,
            leftIndent=10,
            rightIndent=10,
            spaceAfter=0,
        ),
        "meta": ParagraphStyle(
            "Meta",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=SLATE,
            alignment=TA_CENTER,
        ),
    }


STYLES = build_styles()


def para(text, style="body"):
    return Paragraph(text, STYLES[style])


def rich(text):
    return text


def table(data, widths, header=True, font_size=7.3, row_bgs=None):
    cooked = []
    for row in data:
        cooked.append([
            cell if isinstance(cell, Flowable) else Paragraph(str(cell), STYLES["tiny"])
            for cell in row
        ])
    tbl = Table(cooked, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    if header:
        commands.extend([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ])
    for idx, bg in enumerate(row_bgs or [], start=1 if header else 0):
        commands.append(("BACKGROUND", (0, idx), (-1, idx), bg))
    tbl.setStyle(TableStyle(commands))
    return tbl


def callout(text, background=SKY, border=BLUE):
    box = Table([[Paragraph(text, STYLES["callout"])]], colWidths=[7.05 * inch])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 1, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return box


class ArchitectureDiagram(Flowable):
    def __init__(self, target=False):
        super().__init__()
        self.width = 7.0 * inch
        self.height = 3.4 * inch
        self.target = target

    def _box(self, canvas, x, y, w, h, label, fill, stroke=NAVY, font=8):
        canvas.setFillColor(fill)
        canvas.setStrokeColor(stroke)
        canvas.setLineWidth(0.8)
        canvas.roundRect(x, y, w, h, 6, fill=1, stroke=1)
        canvas.setFillColor(NAVY)
        canvas.setFont("Helvetica-Bold", font)
        lines = label.split("\n")
        start = y + h / 2 + (len(lines) - 1) * 5
        for i, line in enumerate(lines):
            canvas.drawCentredString(x + w / 2, start - i * 10, line)

    def _arrow(self, canvas, x1, y1, x2, y2, dashed=False):
        canvas.setStrokeColor(SLATE)
        canvas.setFillColor(SLATE)
        canvas.setLineWidth(1.1)
        if dashed:
            canvas.setDash(3, 2)
        canvas.line(x1, y1, x2, y2)
        canvas.setDash()
        angle_up = y2 >= y1
        if abs(x2 - x1) > abs(y2 - y1):
            dx = -5 if x2 > x1 else 5
            canvas.line(x2, y2, x2 + dx, y2 + 3)
            canvas.line(x2, y2, x2 + dx, y2 - 3)
        else:
            dy = -5 if angle_up else 5
            canvas.line(x2, y2, x2 - 3, y2 + dy)
            canvas.line(x2, y2, x2 + 3, y2 + dy)

    def draw(self):
        c = self.canv
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(NAVY)
        c.drawString(0, self.height - 12, "Target architecture" if self.target else "Current architecture")

        if not self.target:
            self._box(c, 12, 165, 145, 48, "React routes\n14 user-facing screens", SKY)
            self._box(c, 183, 165, 145, 48, "React contexts\nauth, follows, theme", MINT)
            self._box(c, 354, 165, 145, 48, "Browser storage\n7 localStorage keys", GOLD)
            self._arrow(c, 157, 189, 183, 189)
            self._arrow(c, 328, 189, 354, 189)
            self._box(c, 12, 88, 145, 48, "Page data imports\ndirect storage access", ROSE, RED)
            self._box(c, 183, 88, 145, 48, "Check-in token\nbase64, local-only", ROSE, RED)
            self._box(c, 354, 88, 145, 48, "Attendance + rewards\nhardcoded / unwritten", ROSE, RED)
            self._arrow(c, 84, 165, 84, 136)
            self._arrow(c, 255, 165, 255, 136)
            self._arrow(c, 426, 165, 426, 136)
            c.setFillColor(RED)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(255, 53, "No server, shared database, or trusted authorization boundary")
            c.setFillColor(SLATE)
            c.setFont("Helvetica", 7.5)
            c.drawCentredString(255, 35, "Result: the core student-to-organizer check-in path cannot work across devices.")
        else:
            labels = [
                (8, "React UI\nTanStack Query", SKY),
                (108, "Repository\ninterfaces", MINT),
                (208, "Supabase API\nAuth + RLS", SKY),
                (308, "PostgreSQL\nUTC timestamps", MINT),
                (408, "Edge functions\nsensitive workflows", GOLD),
            ]
            for x, label, fill in labels:
                self._box(c, x, 150, 88, 58, label, fill, font=7.5)
            for x in [96, 196, 296, 396]:
                self._arrow(c, x, 179, x + 12, 179)
            self._box(c, 92, 68, 132, 44, "Local adapter\ntests and offline demos", LIGHT)
            self._box(c, 286, 68, 132, 44, "Audit + notification jobs\nleast privilege", LIGHT)
            self._arrow(c, 152, 150, 152, 112)
            self._arrow(c, 352, 150, 352, 112)
            c.setFillColor(TEAL)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(255, 38, "One trusted data model; server-enforced roles; observable failure states")


def page_decor(canvas, doc, short_title):
    canvas.saveState()
    width, height = letter
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, 0.54 * inch, width - doc.rightMargin, 0.54 * inch)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(SLATE)
    canvas.drawString(doc.leftMargin, 0.35 * inch, short_title)
    page_text = f"Page {doc.page}"
    canvas.drawRightString(width - doc.rightMargin, 0.35 * inch, page_text)
    canvas.restoreState()


def cover(story, title, subtitle, tag):
    story.extend([
        Spacer(1, 0.8 * inch),
        para(tag.upper(), "meta"),
        Spacer(1, 0.18 * inch),
        para(title, "title"),
        para(subtitle, "subtitle"),
        Spacer(1, 0.28 * inch),
        callout(
            "<b>Project:</b> flyerrr &nbsp;&nbsp;|&nbsp;&nbsp; "
            "<b>Repository:</b> github.com/oanyamele/flyerrr &nbsp;&nbsp;|&nbsp;&nbsp; "
            "<b>Prepared:</b> September 10, 2026",
            background=LIGHT,
            border=LINE,
        ),
        Spacer(1, 0.45 * inch),
    ])


def build_lab_pdf(path):
    story = []
    cover(
        story,
        "Project Reset and Architecture Baseline",
        "A verified assessment of the current prototype, production gaps, backlog health, and Senior Project II priorities",
        "Lab 1",
    )
    story.extend([
        callout(
            "<b>Bottom line:</b> Flyerrr is visually strong but functionally local-only. "
            "The reset must make the existing screens truthful by adding shared persistence, "
            "server-side authorization, and end-to-end verification.",
            background=GOLD,
            border=AMBER,
        ),
        Spacer(1, 0.22 * inch),
        para("Audit basis", "h2"),
        para(
            "The architecture baseline was established at commit <b>f0c475a</b>. Repository and "
            "project-board status were refreshed on September 10, 2026 against <b>main at "
            "f6c7136</b>. Findings were verified with source inspection, build and test commands, "
            "GitHub issue metadata, workflow metadata, and project-board status.",
        ),
        PageBreak(),
        para("1. Executive assessment", "h1"),
        para(
            "All 14 routes render and the mobile-first design system is coherent. Underneath the "
            "interface, however, all application data remains in browser storage. There is no "
            "shared backend, no trusted authorization boundary, and no server operation that "
            "records attendance. The student-to-organizer check-in flow therefore cannot work "
            "across two devices, and rewards and reporting remain disconnected from real behavior.",
        ),
        table([
            ["Dimension", "Status", "Verified finding"],
            ["UI and design", "Strong", "Coherent tokens, responsive layout, light/dark themes"],
            ["Build", "Strong", "Production build and TypeScript check completed at baseline"],
            ["Architecture", "Critical gap", "No backend or repository seam; pages import storage directly"],
            ["Core correctness", "Critical gap", "Attendance is not persisted; rewards and reports use static data"],
            ["Security", "Critical gap", "Client-side roles, plaintext credentials, forgeable local QR tokens"],
            ["Testing", "Critical gap", "One tautological unit test; defining cross-session flow unverified"],
            ["Process", "Improving", "CI and real issues now exist; branch protection is still absent"],
            ["Backlog", "Operational", "29 issue-backed cards; expanded 88-row CSV still needs reconciliation"],
            ["Documentation", "Critical gap", "Repository README remains a TODO"],
        ], [1.15*inch, 0.9*inch, 5.0*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE, LIGHT, WHITE, LIGHT, WHITE, LIGHT, WHITE]),
        Spacer(1, 0.15 * inch),
        para("Current reset progress", "h2"),
        para(
            "The backend stack ADR, relational schema, and Bun standardization are implemented on "
            "separate pushed branches and are In Review. They are not yet part of main, so the "
            "baseline architecture remains accurate until team approval and merge.",
        ),
        PageBreak(),
        para("2. Current system architecture", "h1"),
        ArchitectureDiagram(target=False),
        Spacer(1, 0.08 * inch),
        table([
            ["Layer", "Implementation", "Current responsibility"],
            ["Presentation", "React, React Router, Tailwind, Radix", "Fourteen routes and reusable UI components"],
            ["Client state", "Auth, Follow, Theme contexts", "Role/session flags, follows, and theme state"],
            ["Data access", "src/data modules", "Direct synchronous reads and writes to localStorage"],
            ["Persistence", "Seven localStorage keys", "Users, events, RSVP, reminders, tokens, session, theme"],
            ["Server tier", "None", "No shared state, trusted auth, transactions, or cross-device flow"],
        ], [1.05*inch, 2.1*inch, 3.9*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE, LIGHT]),
        Spacer(1, 0.14 * inch),
        callout(
            "<b>Architecture explanation:</b> Routes either read a React context or import storage "
            "functions directly. Every write stays on one browser. A QR credential created on a "
            "student device is therefore unknown to an organizer device, and successful validation "
            "does not append an attendance record.",
            background=ROSE,
            border=RED,
        ),
        PageBreak(),
        para("3. Target architecture", "h1"),
        ArchitectureDiagram(target=True),
        Spacer(1, 0.06 * inch),
        para(
            "The selected direction uses Supabase as a managed backend: PostgreSQL for shared data, "
            "Supabase Auth for credentials, Row Level Security for resource authorization, and "
            "narrowly scoped Edge Functions for operations that require server-only secrets or "
            "atomic workflows. The React application accesses the backend through repository "
            "interfaces and TanStack Query rather than importing persistence modules directly.",
        ),
        table([
            ["Decision", "Why it matters"],
            ["Repository interfaces", "Allow page-by-page migration and keep a deterministic local test adapter"],
            ["PostgreSQL", "Supports relationships, uniqueness, reporting, transactions, and UTC-capable timestamps"],
            ["Supabase Auth and RLS", "Moves trust off the client and enforces role plus ownership boundaries"],
            ["TanStack Query", "Makes loading, error, caching, and invalidation states explicit"],
            ["Edge Functions", "Contain signed token issuance, privileged transitions, and provider secrets"],
        ], [1.55*inch, 5.5*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE, LIGHT]),
        PageBreak(),
        para("4. Risk and technical debt register", "h1"),
        para(
            "Severity combines product impact and likelihood. P0 blocks the product from being "
            "real; P1 blocks safe development; P2 has compounding cost if deferred.",
        ),
        table([
            ["ID", "Severity", "Finding", "Required response"],
            ["R-01", "P0", "Cross-device check-in is impossible", "Server-issued, signed, single-use credentials"],
            ["R-02", "P0", "Attendance is never recorded", "Atomic attendance write and live downstream reads"],
            ["R-03", "P0", "Passwords are stored in plaintext", "Managed auth; never persist credentials client-side"],
            ["R-04", "P0", "No backend exists", "Deploy shared API and PostgreSQL staging tier"],
            ["R-05", "P1", "Authorization trusts local role flags", "Server-side role and ownership enforcement"],
            ["R-06", "P1", "QR anti-fraud checks are cosmetic", "Sign, expire, bind, and consume token nonces"],
            ["R-07", "P1", "React hooks are called conditionally", "Move hooks above early return and add regression test"],
            ["R-08", "P1", "No meaningful test coverage", "Data-layer unit tests and cross-session E2E"],
            ["R-09", "P1", "No protected merge gate", "Require CI through branch protection"],
            ["R-10", "P1", "Several rendered features do not persist", "Connect saves, search, verification, and resume data"],
            ["R-11", "P1", "Three competing lockfiles", "Standardize on Bun; branch is In Review"],
            ["R-12", "P1", "Node requirement and setup are undocumented", "Add engines, .nvmrc, and complete README"],
            ["R-13", "P1", "Dependency vulnerabilities were reported", "Upgrade, audit, and enforce the gate"],
            ["R-14", "P2", "Event dates are display strings", "Use timestamptz and explicit display timezones"],
            ["R-15", "P2", "Substantial dead code", "Remove unreferenced components after usage verification"],
            ["R-16", "P2", "Large initial JavaScript bundle", "Route-level code splitting and size budget"],
            ["R-17", "P2", "TypeScript strictness is disabled", "Enable strict checks and fix fallout"],
            ["R-18", "P2", "Generated-platform coupling", "Remove tagger and document owned architecture"],
            ["R-19", "P2", "Installed libraries are unused", "Adopt deliberately during backend migration or remove"],
        ], [0.45*inch, 0.58*inch, 2.6*inch, 3.42*inch], row_bgs=[LIGHT if i % 2 == 0 else WHITE for i in range(19)]),
        Spacer(1, 0.12 * inch),
        table([
            ["Severity", "Count", "Estimated effort"],
            ["P0 - Blocking", "4", "34 points"],
            ["P1 - Safe-development blockers", "9", "30 points"],
            ["P2 - Compounding cleanup", "6", "17 points"],
            ["Total", "19", "81 points"],
        ], [2.7*inch, 1.1*inch, 1.5*inch], row_bgs=[ROSE, GOLD, LIGHT, MINT]),
        PageBreak(),
        para("5. Backlog health and readiness", "h1"),
        table([
            ["Signal", "Current verified result"],
            ["Live GitHub issues", "29 total"],
            ["Project status", "25 Backlog, 3 In Review, 1 Done"],
            ["Technical-debt coverage", "13 issues labeled tech-debt"],
            ["Milestones", "4"],
            ["Labels", "23, including priority, feature, security, testing, and debt"],
            ["Backlog source", "88 detailed feature rows in docs/backlog.csv"],
            ["CI", "One workflow exists on main"],
            ["Branch protection", "Not enabled; GitHub API returns 404"],
            ["Historical PR traceability", "Four merged PRs; none linked to the new issue workflow"],
        ], [2.15*inch, 4.9*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE, LIGHT, WHITE, LIGHT, WHITE, LIGHT]),
        Spacer(1, 0.16 * inch),
        callout(
            "<b>Assessment: 46/50 - operational with a completeness gap.</b> The board now uses "
            "real, assigned, labeled, estimated issues with acceptance criteria. The next governance "
            "task is to reconcile the 29 live issues with the expanded 88-row backlog, require issue "
            "links in new pull requests, and protect main with the CI check.",
            background=MINT,
            border=TEAL,
        ),
        Spacer(1, 0.18 * inch),
        para("Evidence of improvement", "h2"),
        table([
            ["Status", "Item", "Evidence"],
            ["Done", "Convert draft cards to Issues", "Issue #5 closed; 29 issue-backed board cards"],
            ["In Review", "Standardize on Bun", "Issue #9; pushed implementation branch"],
            ["In Review", "Relational schema with ISO timestamps", "Issue #13; ERD and policy document"],
            ["In Review", "Backend stack ADR", "Issue #33; Supabase decision record"],
        ], [0.9*inch, 2.5*inch, 3.65*inch], row_bgs=[MINT, GOLD, GOLD, GOLD]),
        PageBreak(),
        para("6. Initial Senior Project II priorities", "h1"),
        callout("<b>Guiding principle:</b> Stop adding screens. Make the screens that exist tell the truth."),
        Spacer(1, 0.15 * inch),
        table([
            ["Phase", "Priority outcomes", "Exit evidence"],
            ["Sprint 0 - Foundation", "CI, branch rules, Bun, Node docs, hook fix, dependency repair", "Green protected check and reproducible setup"],
            ["Sprint 1 - Backend and seam", "ADR, relational schema, staging backend, repositories, auth, TanStack Query", "Three separate devices observe the same published event"],
            ["Sprint 2 - Core loop", "Signed check-in tokens, attendance writes, rewards/reports, saves, verification persistence", "One cross-session check-in creates one attendance record and updates points"],
            ["Sprint 3 - Hardening", "Coverage, E2E, strict TypeScript, accessibility, failure states, bundle budget", "CI proves correctness, resilience, and usability before merge"],
        ], [1.35*inch, 3.65*inch, 2.05*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE]),
        Spacer(1, 0.16 * inch),
        para("Explicit deferrals", "h2"),
        para(
            "New screens, visual redesign, real NFC, and push notifications are not current "
            "priorities. QR must work across devices first; notifications depend on shared server "
            "state; and the existing interface is already the strongest part of the product.",
        ),
        para("Known unknowns and team risks", "h2"),
        table([
            ["Risk or unknown", "Control"],
            ["Team ownership of generated data code is uneven", "Human reviewer for data and context changes; code-reading session"],
            ["Backend implementation is new scope", "Timebox decisions; prefer documented managed services"],
            ["ADR and schema are not yet approved", "Review and merge contracts before implementation begins"],
            ["Expanded backlog may exceed capacity", "Validate dependencies, preserve P0 ordering, defer lower-value P2 work"],
        ], [2.75*inch, 4.3*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE]),
        PageBreak(),
        para("7. Conclusion and evidence trail", "h1"),
        para(
            "Flyerrr enters Senior Project II with a real product asset and a real architectural "
            "liability. The asset is a coherent mobile experience. The liability is that the "
            "application has no shared source of truth and no trusted execution boundary. The "
            "backlog reset is now operational; the architecture reset is defined and waiting for "
            "reviewed implementation.",
        ),
        callout(
            "<b>Semester success criterion:</b> a student checks in from one session, an authorized "
            "organizer verifies from another, exactly one attendance record is persisted, and the "
            "student's points and the organizer's report update from that same server record.",
            background=MINT,
            border=TEAL,
        ),
        Spacer(1, 0.2 * inch),
        para("Repository evidence", "h2"),
        table([
            ["Artifact", "Purpose"],
            ["docs/PROJECT_RESET_REPORT.md", "Full audit, findings, board assessment, and priorities"],
            ["docs/architecture.md", "Version-controlled Mermaid source for current and target diagrams"],
            ["DEBT_AND_RISK.md", "Rubric-aligned debt and AI-risk inventory"],
            ["docs/backlog.csv", "Feature-level owners, dependencies, estimates, and acceptance criteria"],
            [".github/workflows/ci.yml", "Automated typecheck, lint, test, build, and audit workflow"],
            ["GitHub Issues #5-#33", "Live issue-backed project board"],
        ], [2.35*inch, 4.7*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE, LIGHT, WHITE]),
        Spacer(1, 0.18 * inch),
        para(
            "Reproduction commands include Bun install, TypeScript checking, production build, "
            "Vitest, ESLint, dependency audit, GitHub issue listing, workflow inspection, and "
            "branch-protection inspection. The full command trail is retained in the Markdown "
            "report for repeatability.",
        ),
    ])

    doc = SimpleDocTemplate(
        str(path), pagesize=letter, rightMargin=0.72*inch, leftMargin=0.72*inch,
        topMargin=0.62*inch, bottomMargin=0.72*inch,
        title="Lab 1 - Project Reset and Architecture Baseline",
        author="Flyerrr Team",
    )
    doc.build(
        story,
        onFirstPage=lambda c, d: page_decor(c, d, "Flyerrr - Lab 1"),
        onLaterPages=lambda c, d: page_decor(c, d, "Flyerrr - Lab 1"),
    )


DEBTS = [
    ("TD-01 - Pages are coupled directly to browser storage", "Architectural Debt", "P0 - Blocking",
     "Pages import persistence functions directly and there is no repository or API boundary.",
     "A backend migration becomes an application-wide cutover; authorization and failure behavior remain inconsistent.",
     "Define event, attendance, user, bookmark, and verification repositories with HTTP and local adapters; migrate pages incrementally.",
     "Issue #15 - Repository interface"),
    ("TD-02 - Authentication and authorization are client-side", "Architectural Debt", "P0 - Blocking",
     "Passwords, session roles, and check-in payloads are controlled by browser storage.",
     "Real student data and organization tools cannot be protected by a client-controlled trust boundary.",
     "Use managed auth, PostgreSQL Row Level Security, signed credentials, and server-side audit records.",
     "Issues #16 and #18 - Server auth and signed tokens"),
    ("TD-03 - Tests provide no behavioral confidence", "Test Debt", "P1 - High",
     "The only unit test asserts true equals true; roughly 7,800 source lines lack meaningful coverage.",
     "A green test command does not detect regressions in data, auth, check-in, or reporting.",
     "Test repositories and security paths first; enforce at least 60 percent src/data coverage in CI.",
     "Issue #23 - Data-layer tests"),
    ("TD-04 - End-to-end verification is broken", "Test Debt", "P1 - High",
     "The generated Playwright setup referenced an unavailable package and the core cross-session flow is untested.",
     "A single-browser demo can pass while the real student-to-organizer workflow remains impossible.",
     "Restore standard Playwright and verify login, check-in, attendance, and points in separate sessions.",
     "Issue #24 - Cross-session E2E"),
    ("TD-05 - Setup and architecture knowledge are undocumented", "Documentation Debt", "P1 - High",
     "README.md is a TODO despite Node, Bun, architecture, environment, and workflow requirements.",
     "Teammates and agents must guess setup and system boundaries, increasing inconsistent changes.",
     "Document prerequisites, commands, architecture, configuration, and the issue-to-review workflow.",
     "Issue #8 - README and Node requirements"),
    ("TD-06 - Dependency resolution is nondeterministic", "Architectural Debt", "P1 - High",
     "Three competing lockfiles coexist on main.",
     "Different package managers can install different dependency graphs.",
     "Keep bun.lock only, document Bun, and use a frozen Bun install in CI; implementation is In Review.",
     "Issue #9 - Package-manager standardization"),
]


AI_RISKS = [
    ("AR-01 - Plausible but incorrect generated code", "Reliability / Hallucination", "High / High",
     "An agent can invent an API, misunderstand persistence, or implement only a visual success state.",
     "Require testable issue criteria, reproduce evidence locally, run CI, and trace the full data flow in human review.",
     "Medium until the backend and cross-session E2E exist."),
    ("AR-02 - Secrets or personal data exposed to tools", "Security and Ethics", "Medium / Critical",
     "Environment secrets or student records may be copied into prompts, logs, code, or commits.",
     "Use least privilege, synthetic data, secret scanning, redacted logs, and approval-gated production access.",
     "Medium after server auth and secret scanning; unacceptable before then."),
    ("AR-03 - Untrusted text redirects agent behavior", "Security and Ethics", "Medium / High",
     "Repository, issue, or web content can contain instructions that cause unrelated or unsafe actions.",
     "Treat content as data, scope tools to the task, inspect diffs, and keep destructive or production actions approval-gated.",
     "Low to medium with enforced review and scoped credentials."),
    ("AR-04 - Platform and external-service churn", "Dependency Risk", "Medium / High",
     "Lovable conventions, generated packages, provider APIs, or browser features can change or disappear.",
     "Pin dependencies, isolate providers, record ADRs, test upgrades, and maintain replacement paths.",
     "Medium; interfaces and ADRs reduce but do not eliminate vendor risk."),
]


def build_debt_pdf(path):
    story = []
    cover(
        story,
        "Risk and Technical Debt Inventory",
        "Production-readiness findings, AI-augmented development risks, and actionable backlog integration",
        "Deliverable 2",
    )
    story.extend([
        callout(
            "<b>Verified result:</b> Six significant debt items and four AI/system risks are "
            "documented below. The top three debt priorities are real, assigned GitHub Issues "
            "with acceptance criteria and the required tech-debt label.",
            background=MINT,
            border=TEAL,
        ),
        Spacer(1, 0.25 * inch),
        para("Objective", "h2"),
        para(
            "Move Flyerrr from a generated prototype toward a production-quality system by "
            "identifying structural shortcuts, defining specific remediation, evaluating risks "
            "introduced by AI-augmented development, and converting the highest-leverage findings "
            "into verifiable backlog work.",
        ),
        para("VIBE application", "h2"),
        table([
            ["Stage", "Application"],
            ["Verify", "Trace code and data paths; reproduce build, test, and GitHub evidence"],
            ["Improve", "Define trusted boundaries, stronger documentation, and meaningful checks"],
            ["Build", "Implement through owned issues with explicit acceptance criteria"],
            ["Execute", "Require human review and evidence before merge, deployment, or submission"],
        ], [1.0*inch, 6.05*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE]),
        PageBreak(),
        para("Part 1 - Technical debt audit", "h1"),
    ])

    for idx, (name, category, severity, evidence, impact, remediation, issue) in enumerate(DEBTS):
        card = [
            para(name, "h2"),
            table([
                ["Category", category],
                ["Severity", severity],
                ["Evidence and description", evidence],
                ["Impact", impact],
                ["Remediation plan", remediation],
                ["Backlog item", issue],
            ], [1.38*inch, 5.67*inch], header=False,
               row_bgs=[SKY, WHITE, LIGHT, WHITE, LIGHT, WHITE]),
            Spacer(1, 0.12 * inch),
        ]
        story.append(KeepTogether(card))
        if idx == 2:
            story.append(PageBreak())
            story.append(para("Part 1 - Technical debt audit (continued)", "h1"))

    story.extend([
        PageBreak(),
        para("Part 2 - AI and system risk assessment", "h1"),
        para(
            "Flyerrr is not currently an AI product at runtime. These risks concern the "
            "AI-augmented workflow used to generate, plan, and modify the application.",
        ),
    ])
    for name, area, rating, risk, controls, residual in AI_RISKS:
        story.append(KeepTogether([
            para(name, "h2"),
            table([
                ["Required area", area],
                ["Likelihood / impact", rating],
                ["Risk", risk],
                ["Controls", controls],
                ["Residual risk", residual],
            ], [1.38*inch, 5.67*inch], header=False,
               row_bgs=[SKY, WHITE, LIGHT, WHITE, LIGHT]),
            Spacer(1, 0.13 * inch),
        ]))

    story.extend([
        PageBreak(),
        para("Part 3 - Backlog integration", "h1"),
        para(
            "The three highest-leverage debt findings are real GitHub Issues on the Flyerrr "
            "project board. Their acceptance criteria were refined with AI assistance and checked "
            "against repository evidence. Each issue is assigned, estimated, and labeled "
            "tech-debt.",
        ),
        table([
            ["Priority", "Debt finding", "Issue", "Status", "Verification target"],
            ["1", "No repository/API boundary", "#15", "Backlog", "Interfaces, adapters, no direct page imports, unit tests"],
            ["2", "No meaningful data-layer tests", "#23", "Backlog", "Security/data paths and at least 60 percent coverage"],
            ["3", "Missing setup and architecture entry point", "#8", "Backlog", "Node, Bun, scripts, architecture, fresh-clone test"],
        ], [0.48*inch, 1.65*inch, 0.55*inch, 0.72*inch, 3.65*inch], row_bgs=[LIGHT, WHITE, LIGHT]),
        Spacer(1, 0.18 * inch),
        table([
            ["Board signal", "Verified September 10, 2026"],
            ["Real GitHub Issues", "29"],
            ["Project status", "25 Backlog, 3 In Review, 1 Done"],
            ["Issues labeled tech-debt", "13"],
            ["Detailed feature backlog", "88 rows in docs/backlog.csv"],
            ["Remaining governance gap", "Reconcile CSV rows to live issues; require issue links in PRs"],
        ], [2.15*inch, 4.9*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE, LIGHT]),
        Spacer(1, 0.2 * inch),
        para("Human-in-the-loop operating rules", "h2"),
        table([
            ["Rule", "Control"],
            ["1", "A named human owns each issue and approves architecture or security decisions."],
            ["2", "Agent-produced claims are reproduced with local commands or source inspection."],
            ["3", "Rendered success is not completion; tests must verify state change and failure paths."],
            ["4", "Secrets, production data, merges, deployments, and submissions remain approval-gated."],
            ["5", "Every implementation uses an issue-specific branch and review before merge."],
        ], [0.55*inch, 6.5*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE, LIGHT]),
        PageBreak(),
        para("Conclusion", "h1"),
        para(
            "Flyerrr's most serious debt is the absence of trusted persistence, authorization, and "
            "verification boundaries beneath an otherwise convincing interface. The existing "
            "project board now makes the findings actionable. Production readiness should be "
            "measured by behavior across independent sessions, not by whether a screen renders.",
        ),
        callout(
            "<b>Release test:</b> a student checks in from one session, an authorized organizer "
            "validates from another, exactly one attendance row is written, and points and reports "
            "update from the same server record.",
            background=GOLD,
            border=AMBER,
        ),
        Spacer(1, 0.22 * inch),
        para("Evidence references", "h2"),
        table([
            ["Reference", "Evidence"],
            ["docs/PROJECT_RESET_REPORT.md", "Full 19-item risk register, impact, fixes, estimates, board audit"],
            ["docs/architecture.md", "Current and target architecture plus broken check-in data flow"],
            ["docs/backlog.csv", "Owners, priorities, dependencies, estimates, and acceptance criteria"],
            ["Issues #8, #15, and #23", "Top-three debt items with tech-debt labels and acceptance checklists"],
            ["Issues #5-#33", "Live issue-backed project board"],
        ], [2.2*inch, 4.85*inch], row_bgs=[LIGHT, WHITE, LIGHT, WHITE, LIGHT]),
    ])

    doc = SimpleDocTemplate(
        str(path), pagesize=letter, rightMargin=0.72*inch, leftMargin=0.72*inch,
        topMargin=0.62*inch, bottomMargin=0.72*inch,
        title="Deliverable 2 - Risk and Technical Debt Inventory",
        author="Flyerrr Team",
    )
    doc.build(
        story,
        onFirstPage=lambda c, d: page_decor(c, d, "Flyerrr - Deliverable 2"),
        onLaterPages=lambda c, d: page_decor(c, d, "Flyerrr - Deliverable 2"),
    )


if __name__ == "__main__":
    lab_path = OUTPUT_DIR / "Lab_1_Project_Reset_Architecture_Baseline.pdf"
    debt_path = OUTPUT_DIR / "Deliverable_2_Risk_and_Technical_Debt.pdf"
    build_lab_pdf(lab_path)
    build_debt_pdf(debt_path)
    print(lab_path)
    print(debt_path)
