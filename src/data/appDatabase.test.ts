import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authenticateUser,
  createEventRecord,
  createUser,
  getDatabase,
  pointsForEvent,
  recordCheckIn,
} from "@/data/appDatabase";

const eventInput = {
  title: "Lab Showcase",
  description: "Demo night",
  image: "/flyers/lab.png",
  category: "academic" as const,
  date: "Fri, Oct 3",
  time: "6:00 PM",
  location: "iLab",
  capacity: 40,
  tags: ["demo"],
  creatorName: "Campus Officer",
  creatorRole: "org_officer" as const,
  creatorUserId: "user-admin-1",
};

describe("accounts and events", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates an account, signs that person in, and rejects a bad password", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T00:00:00.000Z"));
    const created = await createUser({
      email: " New.Student@howard.edu ",
      password: "secret",
      name: "  New Student  ",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.user.email).toBe("new.student@howard.edu");
    expect(created.user.name).toBe("New Student");
    // Sign-up always creates a student, and only a hash of the password is stored.
    expect(created.user.role).toBe("student");
    expect(created.user.password).toBeUndefined();
    expect(created.user.passwordHash).not.toBe("secret");

    vi.setSystemTime(new Date("2026-03-02T12:00:00.000Z"));
    const signedIn = await authenticateUser({
      email: "new.student@howard.edu",
      password: "secret",
    });
    expect(signedIn.ok).toBe(true);
    if (signedIn.ok) {
      const stored = getDatabase().users.find((user) => user.id === signedIn.user.id);
      expect(stored?.lastLoginAt).toBe("2026-03-02T12:00:00.000Z");
      expect(signedIn.user.lastLoginAt).toBe("2026-03-02T12:00:00.000Z");
    }

    expect(await authenticateUser({
      email: "new.student@howard.edu",
      password: "wrong",
    })).toEqual({ ok: false, error: "Invalid email or password." });
  });

  it("gives a student event the default org and an officer event their own org", () => {
    const studentEvent = createEventRecord({
      ...eventInput,
      creatorName: "Campus Student",
      creatorRole: "student",
      capacity: 0,
    });
    expect(studentEvent.org.name).toBe("CS Society");
    expect(studentEvent.capacity).toBe(100);
    expect(studentEvent.checkInPoints).toBe(10);

    const officerEvent = createEventRecord({ ...eventInput, creatorName: "" });
    expect(officerEvent.org.name).toBe(" Org");
    expect(officerEvent.org.avatar).toBe("OF");
    expect(officerEvent.org.verified).toBe(false);
  });

  it("restores a changed seed event and adds a seed event that was deleted", () => {
    const db = getDatabase();
    const changed = db.events.map((event) =>
      event.id === "1" ? { ...event, title: "Changed title" } : event,
    );
    localStorage.setItem("flyer_db_v1", JSON.stringify({
      ...db,
      events: changed.filter((event) => event.id !== "10"),
    }));

    const next = getDatabase();
    expect(next.events.find((event) => event.id === "1")?.title).toBe("Welcome Week Block Party");
    expect(next.events.some((event) => event.id === "10")).toBe(true);
  });

  it("reseeds when the stored database cannot be parsed", () => {
    localStorage.setItem("flyer_db_v1", "{broken");
    expect(getDatabase().users.some((user) => user.email === "student@howard.edu")).toBe(true);
    expect(localStorage.getItem("flyer_db_v1")).toContain("student@howard.edu");
  });
});

describe("check-in records", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes the configured points and refuses a second check-in", () => {
    expect(pointsForEvent({ id: "2" })).toBe(15);
    expect(pointsForEvent({ id: "9", checkInPoints: 4 })).toBe(4);
    expect(pointsForEvent({ id: "missing" })).toBe(10);

    const saved = recordCheckIn({ eventId: "2", userId: "user-student-1" });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.record).toMatchObject({
      eventTitle: "24-Hour Hackathon",
      attendeeName: "Campus Student",
      pointsAwarded: 15,
    });
    expect(getDatabase().attendance[0]?.id).toBe(saved.record.id);

    expect(recordCheckIn({ eventId: "2", userId: "user-student-1" })).toEqual({
      ok: false,
      reason: "This student is already checked in for this event.",
    });
    expect(recordCheckIn({ eventId: "missing", userId: "user-student-1" })).toEqual({
      ok: false,
      reason: "Event not found.",
    });
    expect(recordCheckIn({ eventId: "1", userId: "missing" })).toEqual({
      ok: false,
      reason: "Student account not found.",
    });
  });
});
