import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FollowProvider } from "@/contexts/FollowContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { getDatabase, type AppDatabase } from "@/data/appDatabase";
import type { AttendanceRecord } from "@/data/attendanceStore";
import * as appDatabase from "@/data/appDatabase";
import * as repository from "@/data/repository";
import { useAsyncData } from "@/hooks/useAsyncData";
import AttendanceReports from "@/pages/AttendanceReports";
import Explore from "@/pages/Explore";
import Index from "@/pages/Index";
import OrganizationVerificationQueue from "@/pages/OrganizationVerificationQueue";
import Profile from "@/pages/Profile";
import TapIn from "@/pages/TapIn";

const DB_KEY = "flyer_db_v1";

const renderPage = (Page: ComponentType) =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <FollowProvider>
            <Page />
          </FollowProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

const attendance = (overrides: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
  id: "r1",
  eventId: "1",
  eventTitle: "Test Event",
  orgId: "1",
  orgName: "Test Org",
  attendeeId: "user-1",
  attendeeName: "Test Attendee",
  attendeeEmail: "attendee@example.test",
  checkedInAt: new Date().toISOString(),
  pointsAwarded: 10,
  ...overrides,
});

const saveDb = (change: (db: AppDatabase) => AppDatabase) =>
  localStorage.setItem(DB_KEY, JSON.stringify(change(getDatabase())));

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("useAsyncData", () => {
  it("moves from loading to error, and a retry calls the fetcher again", async () => {
    const fetcher = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce("ok");
    const { result } = renderHook(() => useAsyncData(fetcher));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toBe("ok");
  });
});

describe("repository", () => {
  it("does not seed attendance records into a new database", async () => {
    expect((await repository.fetchAttendanceReport()).records).toEqual([]);
  });

  it("returns zero stats for a new account", async () => {
    const stats = await repository.fetchUserStats("brand-new-user");
    expect(stats).toMatchObject({ eventsAttended: 0, points: 0, distinctWeeks: 0 });
  });

  it("calculates stats from the account's own records only", async () => {
    saveDb((db) => ({
      ...db,
      attendance: [attendance(), attendance({ id: "r2", attendeeId: "someone-else", pointsAwarded: 99 })],
    }));
    const stats = await repository.fetchUserStats("user-1");
    expect(stats).toMatchObject({ eventsAttended: 1, points: 10, distinctWeeks: 1 });
  });

  it("reports unreadable storage as an error instead of as no data", async () => {
    localStorage.setItem(DB_KEY, "{not json");
    await expect(repository.fetchEvents()).rejects.toBeInstanceOf(repository.DataAccessError);
    expect(localStorage.getItem(DB_KEY)).toBe("{not json");
  });
});

describe("Home feed", () => {
  it("shows the loading skeleton while events load", () => {
    vi.spyOn(repository, "fetchEvents").mockReturnValue(new Promise(() => undefined));
    renderPage(Index);
    expect(screen.getByLabelText("Loading events")).toBeInTheDocument();
  });

  it("shows the empty message when there are no events", async () => {
    vi.spyOn(repository, "fetchEvents").mockResolvedValue([]);
    renderPage(Index);
    expect(await screen.findByText("No events available yet.")).toBeInTheDocument();
  });

  it("retries against real storage and recovers", async () => {
    getDatabase();
    const good = localStorage.getItem(DB_KEY) as string;
    localStorage.setItem(DB_KEY, "{not json");
    renderPage(Index);

    const message = await screen.findByText("We couldn't load the events feed.");
    expect(screen.queryByText("No events available yet.")).not.toBeInTheDocument();

    localStorage.setItem(DB_KEY, good);
    fireEvent.click(within(message.closest('[role="alert"]') as HTMLElement).getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByText("We couldn't load the events feed.")).not.toBeInTheDocument());
    const { events } = JSON.parse(good) as AppDatabase;
    expect(await screen.findByText(events[0].title)).toBeInTheDocument();
  });

  it("separates an empty category from having no events at all", async () => {
    const [event] = getDatabase().events;
    vi.spyOn(repository, "fetchEvents").mockResolvedValue([{ ...event, category: "career" }]);
    renderPage(Index);
    await screen.findByText(event.title);
    fireEvent.click(screen.getByRole("button", { name: /Sports/ }));
    expect(await screen.findByText("No events in this category")).toBeInTheDocument();
    expect(screen.queryByText("No events available yet.")).not.toBeInTheDocument();
  });

  it("offers a way to find clubs when the user follows none", async () => {
    renderPage(Index);
    await screen.findByText(getDatabase().events[0].title);
    fireEvent.click(screen.getByRole("button", { name: /Following/ }));
    expect(await screen.findByText("You haven't followed any clubs yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore organizations" })).toBeInTheDocument();
  });
});

describe("Attendance Reporting", () => {
  it("shows a clear message and no export when there are no records", async () => {
    renderPage(AttendanceReports);
    expect(await screen.findByText("No attendance records yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export Attendance Report/ })).not.toBeInTheDocument();
  });

  it("keeps the summary and export when records exist", async () => {
    saveDb((db) => ({ ...db, attendance: [attendance()] }));
    renderPage(AttendanceReports);
    expect(await screen.findByText("Test Event")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export Attendance Report/ })).toBeInTheDocument();
  });

  it("shows a retryable error when records can't be read", async () => {
    localStorage.setItem(DB_KEY, "{not json");
    renderPage(AttendanceReports);
    expect(await screen.findByText("We couldn't load attendance records.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("Total check-ins")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export Attendance Report/ })).not.toBeInTheDocument();
  });
});

describe("Profile statistics", () => {
  it("shows zeros rather than the old hardcoded values", async () => {
    renderPage(Profile);
    expect(await screen.findByText("Events Attended")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(3);
    expect(screen.getByText("0 wk")).toBeInTheDocument();
    ["23", "450", "8", "5 weeks"].forEach((old) => expect(screen.queryByText(old)).not.toBeInTheDocument());
  });
});

describe("Other list screens", () => {
  it("tells the user when an Explore search has no results", async () => {
    renderPage(Explore);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz-no-match" } });
    expect(await screen.findByText("No results found")).toBeInTheDocument();
  });

  it("shows search results when there is a match", async () => {
    renderPage(Explore);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "hackathon" } });
    expect(await screen.findByText("24-Hour Hackathon")).toBeInTheDocument();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
  });

  it("shows an empty Verification Queue", () => {
    renderPage(() => <OrganizationVerificationQueue initialRequests={[]} />);
    expect(screen.getByText("No verification requests")).toBeInTheDocument();
    expect(screen.getByText("0 pending review")).toBeInTheDocument();
  });

  it("still lists Verification Queue requests by default", () => {
    renderPage(OrganizationVerificationQueue);
    expect(screen.getByText("Women in Product")).toBeInTheDocument();
    expect(screen.queryByText("No verification requests")).not.toBeInTheDocument();
  });

  it("shows Tap In's empty state when there are no events", () => {
    vi.spyOn(appDatabase, "listEventRecords").mockReturnValue([]);
    renderPage(TapIn);
    expect(screen.getByText("No events to check in to")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("still shows the Tap In event picker when events exist", () => {
    renderPage(TapIn);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.queryByText("No events to check in to")).not.toBeInTheDocument();
  });
});

describe("Explore clubs", () => {
  it("prompts the user to follow a club when they follow none", async () => {
    renderPage(Explore);
    expect(await screen.findByText("You haven't followed any clubs yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse events" })).toBeInTheDocument();
  });

  it("lists followed clubs", async () => {
    const club = getDatabase().events[0].org;
    localStorage.setItem("flyerrr_follows", JSON.stringify([club.id]));
    renderPage(Explore);
    await waitFor(() => expect(screen.getAllByText(club.name).length).toBeGreaterThanOrEqual(2));
    expect(screen.queryByText("You haven't followed any clubs yet.")).not.toBeInTheDocument();
  });

  it("handles no events or clubs being available", async () => {
    vi.spyOn(repository, "fetchEvents").mockResolvedValue([]);
    renderPage(Explore);
    expect(await screen.findByText("No events available yet.")).toBeInTheDocument();
    expect(screen.queryByText("Clubs You Follow")).not.toBeInTheDocument();
  });

  it("shows a retryable error, including during a search", async () => {
    localStorage.setItem(DB_KEY, "{not json");
    renderPage(Explore);
    expect(await screen.findByText("We couldn't load events and organizations.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "hackathon" } });
    expect(screen.getByText("We couldn't load events and organizations.")).toBeInTheDocument();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
