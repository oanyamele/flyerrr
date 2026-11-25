import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/lib/storage";
import * as appDatabase from "@/data/appDatabase";
import { recordCheckIn } from "@/data/appDatabase";
import { toggleRsvp } from "@/data/checkInStore";
import {
  DataAccessError,
  computeUserStats,
  fetchAttendanceForUser,
  fetchAttendanceReport,
  fetchEvent,
  fetchEvents,
  fetchReminderEvents,
  fetchUserStats,
  saveNewEvent,
} from "@/data/repository";

const eventInput = {
  title: "Published from the repository",
  description: "Coverage event",
  image: "/flyers/lab.png",
  category: "career" as const,
  date: "Fri, Oct 3",
  time: "6:00 PM",
  location: "iLab",
  capacity: 25,
  tags: ["demo"],
  creatorName: "Campus Officer",
  creatorRole: "org_officer" as const,
  creatorUserId: "user-admin-1",
};

describe("local data repository", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("reads and writes events without calling the network", async () => {
    const before = await fetchEvents();
    expect(before.some((event) => event.title === "Welcome Week Block Party")).toBe(true);
    expect(await fetchEvent("1")).toMatchObject({ title: "Welcome Week Block Party" });
    expect(await fetchEvent("missing")).toBeNull();

    const created = await saveNewEvent(eventInput);
    expect((await fetchEvents())[0]?.id).toBe(created.id);
  });

  it("keeps corrupt storage intact and reports a data error", async () => {
    localStorage.setItem(STORAGE_KEYS.database, "{broken");
    await expect(fetchEvents()).rejects.toBeInstanceOf(DataAccessError);
    expect(localStorage.getItem(STORAGE_KEYS.database)).toBe("{broken");
  });

  it("wraps an unexpected storage failure as a data error", async () => {
    vi.spyOn(appDatabase, "getDatabase").mockImplementation(() => {
      throw new Error("disk");
    });
    await expect(fetchEvents()).rejects.toMatchObject({ name: "DataAccessError" });
  });

  it("returns one student's attendance, reminders, and stats", async () => {
    expect(await fetchAttendanceForUser(null)).toEqual([]);
    const saved = recordCheckIn({ eventId: "1", userId: "user-student-1" });
    const later = recordCheckIn({ eventId: "4", userId: "user-student-1" });
    expect(saved.ok && later.ok).toBe(true);

    const history = await fetchAttendanceForUser("user-student-1");
    expect(history.map((row) => row.eventId)).toEqual(["4", "1"]);

    const report = await fetchAttendanceReport();
    expect(report.records.length).toBeGreaterThan(0);
    expect(report.summary.some((row) => row.eventId === "1")).toBe(true);

    toggleRsvp("2", "user-student-1");
    expect((await fetchReminderEvents("user-student-1")).map((event) => event.id)).toEqual(["2"]);

    const stats = await fetchUserStats("user-student-1");
    expect(stats.eventsAttended).toBe(2);
    expect(stats.points).toBe(15);
    expect(stats.categoriesAttended).toBe(2);
    expect(await fetchUserStats(null)).toMatchObject({ eventsAttended: 0, points: 0 });
  });

  it("counts distinct categories and weeks", () => {
    const stats = computeUserStats(
      [
        {
          id: "a",
          eventId: "1",
          eventTitle: "Welcome",
          orgId: "4",
          orgName: "Student Union",
          attendeeId: "u",
          attendeeName: "A",
          attendeeEmail: "a@howard.edu",
          checkedInAt: "2025-09-12T18:00:00.000Z",
          pointsAwarded: 10,
        },
        {
          id: "b",
          eventId: "missing",
          eventTitle: "Gone",
          orgId: "4",
          orgName: "Student Union",
          attendeeId: "u",
          attendeeName: "A",
          attendeeEmail: "a@howard.edu",
          checkedInAt: "2025-10-01T18:00:00.000Z",
          pointsAwarded: 3,
        },
      ],
      [{ id: "1", category: "social" } as appDatabase.EventRecord],
    );
    expect(stats).toMatchObject({ eventsAttended: 2, points: 13, categoriesAttended: 1, distinctWeeks: 2 });
  });
});
