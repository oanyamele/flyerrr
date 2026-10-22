"""Build the Lab 3 submission PDF from the refactor notes and verification shots."""

from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "Lab3_AI_Assisted_Refactoring.pdf"
SHOTS = ROOT / "output" / "lab3"

styles = getSampleStyleSheet()
title = ParagraphStyle(
    "LabTitle",
    parent=styles["Title"],
    fontName="Times-Bold",
    fontSize=18,
    leading=22,
    textColor=HexColor("#1e3a5f"),
    alignment=TA_LEFT,
    spaceAfter=4,
)
subtitle = ParagraphStyle(
    "LabSub",
    parent=styles["Normal"],
    fontName="Times-Roman",
    fontSize=11,
    leading=14,
    textColor=HexColor("#334155"),
    spaceAfter=12,
)
h1 = ParagraphStyle(
    "LabH1",
    parent=styles["Heading1"],
    fontName="Times-Bold",
    fontSize=14,
    leading=18,
    textColor=HexColor("#1e3a5f"),
    spaceBefore=14,
    spaceAfter=6,
)
h2 = ParagraphStyle(
    "LabH2",
    parent=styles["Heading2"],
    fontName="Times-Bold",
    fontSize=12,
    leading=15,
    textColor=HexColor("#1e3a5f"),
    spaceBefore=10,
    spaceAfter=4,
)
body = ParagraphStyle(
    "LabBody",
    parent=styles["Normal"],
    fontName="Times-Roman",
    fontSize=11,
    leading=15,
    spaceAfter=8,
)
bullet_style = ParagraphStyle(
    "LabBullet",
    parent=body,
    leftIndent=0,
    spaceAfter=2,
)
code = ParagraphStyle(
    "LabCode",
    parent=styles["Code"],
    fontName="Courier",
    fontSize=8,
    leading=10,
    leftIndent=6,
    rightIndent=6,
    spaceBefore=4,
    spaceAfter=8,
)
caption = ParagraphStyle(
    "LabCaption",
    parent=body,
    fontName="Times-Italic",
    fontSize=9,
    leading=12,
    textColor=HexColor("#475569"),
    spaceBefore=2,
    spaceAfter=10,
)


def P(text: str) -> Paragraph:
    return Paragraph(text, body)


def bullets(items: list[str]) -> list[Paragraph]:
    rows = [Paragraph(f"- {item}", bullet_style) for item in items]
    rows.append(Spacer(1, 6))
    return rows


def shot(name: str, max_width: float = 6.4 * inch) -> Image:
    path = SHOTS / name
    with PILImage.open(path) as image:
        width, height = image.size
    scale = max_width / width
    return Image(str(path), width=max_width, height=height * scale)


def build() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title="Lab 3 - AI-Assisted Refactoring",
        author="flyerrr",
    )
    story = [
        Paragraph("Lab 3 - AI-Assisted Refactoring", title),
        Paragraph(
            "flyerrr &nbsp;&nbsp;|&nbsp;&nbsp; Branch lab/introduce-repository-seam &nbsp;&nbsp;|&nbsp;&nbsp; October 22, 2026",
            subtitle,
        ),
        Paragraph("1. Refactor Rationale", h1),
        Paragraph("Constraint", h2),
        P(
            "The Lovable prototype stored accounts and events in browser localStorage, and the pages called that storage module directly. Login, the home feed, event detail, Tap In, reminders, and create-event imported createUser, authenticateUser, listEventRecords, or createEventRecord from src/data/appDatabase.ts."
        ),
        P(
            "That violates the Dependency Inversion Principle. The view depended on one concrete storage engine, so replacing localStorage with an API would mean editing every page. It also mixed two responsibilities in appDatabase.ts: the storage engine (read, write, seed) and the account and event use cases. Session state had already been pulled into src/services/authService.ts. Account records and the event catalog had not."
        ),
        Paragraph("Solution", h2),
        P(
            "I applied Dependency Inversion and Dependency Injection. Use cases now depend on a DatabasePort. Pages depend on UserRepository and EventRepository, which the app injects through RepositoryProvider. localStorage remains the production adapter. An in-memory adapter implements the same port and is used to prove the use cases are not tied to the browser."
        ),
        Paragraph("Old structure", h2),
        P("Pages called functions in src/data/appDatabase.ts, which both defined the use cases and wrote localStorage."),
        Paragraph("New structure", h2),
        *bullets(
            [
                "src/repositories/contracts.ts - UserRepository and EventRepository",
                "src/repositories/databasePort.ts - read and save",
                "src/repositories/localStorageDatabase.ts - production adapter",
                "src/repositories/inMemoryDatabase.ts - adapter with no browser writes",
                "src/repositories/userRepository.ts and eventRepository.ts - the use cases, written once",
                "src/repositories/RepositoryProvider.tsx - injects the bundle into the tree",
                "src/data/appDatabase.ts - storage engine only (seed, getDatabase, saveDatabase)",
            ]
        ),
        P(
            "Check-in tokens, reminder storage, and the attendance report still import their own stores. Explore still reads the mock event list. Those are the next slices of GitHub issue #15. This change does not add an HTTP client, because the app still has no API."
        ),
        Paragraph("2. AI Usage Summary", h1),
        P(
            "I used Cursor's agent (Composer) on the Lab 3 prompt: audit the Lovable-generated app, refactor one structural problem toward a production boundary, keep the current behavior, and document the prompts, the human edits, and the verification."
        ),
        Paragraph("Prompt", h2),
        Preformatted(
            "Audit the flyerrr codebase for a structural code smell.\n"
            "Introduce a repository seam so pages stop calling localStorage\n"
            "use cases directly. Keep sign-in, the feed, and event publishing\n"
            "behaving as they do now. Add tests for the local adapter and\n"
            "for a second adapter that does not touch localStorage.",
            code,
        ),
        Paragraph("What Cursor generated", h2),
        P(
            "The repository contracts, both storage adapters, the provider, the page call-site updates, and the unit tests. The use-case steps (email normalization, duplicate-account error, role check, event inserted at the front of the list, capacity of 0 stored as 100) were moved as they existed."
        ),
        Paragraph("Human review changes", h2),
        *bullets(
            [
                "RepositoryProvider memoizes the repository bundle. A new object on every render would retrigger the home feed's refresh effect.",
                "TypeScript is set to strict: false, and if (!result.ok) did not narrow the result union. tsc reported that result.error did not exist. Login now checks result.ok === false. The message shown to the user is unchanged.",
                "Sign-in used to read the clock twice, once for the saved user and once for the returned user, so the two timestamps could differ by a millisecond. The repository now stores and returns one lastLoginAt. loginWithUser does not read that field.",
                "EventDetail returned before two useEffect calls. A missing event id changed the hook count, which breaks the Rules of Hooks. The effects already returned early when the event was missing, so they were moved above the return. The page for a real event is unchanged.",
                "Corrupt JSON in the storage engine still falls back to a fresh seed. I left that recovery alone. Throwing would wipe a user's local data.",
                "I did not add an HttpRepository. There is no server. A client that only throws would look like a seam and would not be testable. The in-memory port is the second implementation.",
            ]
        ),
        Paragraph("3. Verification", h1),
        Paragraph("Automated", h2),
        P("npx vitest run and npx tsc -p tsconfig.app.json --noEmit. TypeScript completed with no errors. Vitest: 3 files, 12 tests, all passed."),
        Preformatted(
            "src/test/example.test.ts                         1 passed\n"
            "src/test/authService.test.ts                    6 passed\n"
            "src/repositories/repositories.test.ts           5 passed\n"
            "Test Files  3 passed (3)\n"
            "Tests       12 passed (12)",
            code,
        ),
        P("The new tests cover:"),
        *bullets(
            [
                "Login, the feed, create-event, event detail, Tap In, and reminders no longer import src/data/appDatabase.",
                "The seeded student can sign in. The same password with the officer role is rejected.",
                "Sign-up trims and lowercases the email, persists across a new repository instance, and rejects a duplicate email.",
                "A published event is first in the catalog, capacity 0 is stored as 100, and the seeded events remain.",
                "The same sign-up against the in-memory port does not write the flyer_db_v1 key, and that user is invisible to the localStorage adapter.",
            ]
        ),
        Paragraph("Manual, on http://localhost:8080", h2),
        *bullets(
            [
                "Student sign-in with student@howard.edu / password123 opens the feed.",
                "Welcome Week Block Party opens its detail page.",
                "A full reload stays on the feed. The session survives refresh.",
                "Profile shows Campus Student.",
                "Sign out returns to the role picker.",
                "A wrong password stays on the login page and shows: Invalid email, password, or role.",
                "Officer sign-in with officer@howard.edu / password123 shows the Create control.",
                "Publishing Lab Showcase puts that event first on the feed.",
                "A full reload keeps Lab Showcase at the top.",
            ]
        ),
        P(
            "Protected routes still send a signed-out browser to /login. The existing authService tests still pass, including corrupt session JSON and logout."
        ),
        Paragraph("Screenshots", h2),
        shot("03-profile-session.png"),
        Paragraph("Figure 1. Signed-in student profile after login through UserRepository.", caption),
        shot("04-invalid-login.png"),
        Paragraph("Figure 2. Rejected sign-in. The error string is the same one the storage module used to return.", caption),
        shot("05-published-event.png", max_width=6.6 * inch),
        Paragraph(
            "Figure 3. After an officer publishes Lab Showcase, the feed lists it first and the Create control is still the officer action.",
            caption,
        ),
        Paragraph("What this refactor does not change", h2),
        P(
            "Attendance numbers, rewards, and the resume are still seeded or local component state. Check-in tokens are still written to the browser that created them. Explore still searches the mock list, so a newly published event does not appear there. Those were true before this change and are still true."
        ),
    ]
    doc.build(story)
    print(OUT)


if __name__ == "__main__":
    build()
