/**
 * F2.3 (#20): the Resume Builder starts empty, keeps edits across reloads,
 * and lists campus involvement from the user's real check-ins.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { getDatabase } from "@/data/appDatabase";
import type { AttendanceRecord } from "@/data/attendanceStore";
import { buildCampusInvolvement, emptyResume, loadResume, RESUME_STORAGE_KEY, saveResume } from "@/data/resumeStore";
import { AUTH_STORAGE_KEY } from "@/services/authService";
import ResumeBuilder from "@/pages/ResumeBuilder";

const DB_KEY = "flyer_db_v1";
const student = { isLoggedIn: true, role: "student", userName: "Campus Student", email: "student@howard.edu", userId: "user-student-1" };

const record = (overrides: Partial<AttendanceRecord>): AttendanceRecord => ({
  id: "r1",
  eventId: "1",
  eventTitle: "Welcome Week Block Party",
  orgId: "4",
  orgName: "Student Union",
  attendeeId: "user-student-1",
  attendeeName: "Campus Student",
  attendeeEmail: "student@howard.edu",
  checkedInAt: "2026-09-12T18:15:00.000Z",
  pointsAwarded: 10,
  ...overrides,
});

const renderPage = () => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(student));
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter>
          <ResumeBuilder />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
};

describe("resumeStore", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty for a new user", async () => {
    expect(await loadResume("user-new")).toEqual(emptyResume());
  });

  it("saves per user and trims values", async () => {
    await saveResume("user-a", { ...emptyResume(), major: "  Biology  " });
    expect((await loadResume("user-a")).major).toBe("Biology");
    expect(await loadResume("user-b")).toEqual(emptyResume());
  });

  it("reports unreadable data instead of overwriting it", async () => {
    localStorage.setItem(RESUME_STORAGE_KEY, "{broken");
    await expect(loadResume("user-a")).rejects.toThrow("couldn't load your resume");
    await expect(saveResume("user-a", emptyResume())).rejects.toThrow();
    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBe("{broken");
  });

  it("builds involvement newest first, one line per event", () => {
    const lines = buildCampusInvolvement([
      record({ id: "r1", eventId: "1", checkedInAt: "2026-09-12T18:00:00.000Z" }),
      record({ id: "r2", eventId: "2", eventTitle: "24-Hour Hackathon", orgName: "CS Society", checkedInAt: "2026-10-03T18:00:00.000Z" }),
      record({ id: "r3", eventId: "1", checkedInAt: "2026-09-12T19:00:00.000Z" }),
    ]);
    expect(lines).toEqual(["24-Hour Hackathon · CS Society, Oct 2026", "Welcome Week Block Party · Student Union, Sep 2026"]);
  });
});

describe("Resume Builder page", () => {
  beforeEach(() => localStorage.clear());

  it("shows no made-up details for a brand-new user", async () => {
    renderPage();
    expect(await screen.findByText("Add your school, major and graduation year.")).toBeInTheDocument();
    expect(await screen.findByText("No check-ins yet.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Google|Hackathon Participant|Intramural/);
  });

  it("keeps saved edits after a reload", async () => {
    const { unmount } = renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Edit resume" }));
    fireEvent.change(screen.getByLabelText("Major"), { target: { value: "Computer Science" } });
    fireEvent.change(screen.getByLabelText("Skills"), { target: { value: "React, SQL" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText("SQL")).toBeInTheDocument();
    unmount();

    renderPage();
    expect(await screen.findByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("lists events from the user's own attendance records", async () => {
    const db = getDatabase();
    db.attendance = [record({}), record({ id: "x", eventId: "9", eventTitle: "Someone Else's Event", attendeeId: "user-other" })];
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    renderPage();
    expect(await screen.findByText("Welcome Week Block Party · Student Union, Sep 2026")).toBeInTheDocument();
    expect(screen.queryByText(/Someone Else's Event/)).not.toBeInTheDocument();
  });
});
