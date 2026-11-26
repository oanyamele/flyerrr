import { beforeEach, describe, expect, it } from "vitest";
import { repositoryMode } from "@/repositories/config";
import type { AttendanceRepository, EventRepository, UserRepository } from "@/repositories/contracts";
import { HttpRepository } from "@/repositories/httpRepository";
import type { EventRecord } from "@/data/appDatabase";
import { LocalStorageRepository } from "@/repositories/localStorageRepository";
import { openHttpRepositories } from "@/repositories/openRepositories";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("repository config", () => {
  it("keeps localStorage as the adapter unless the env selects http", () => {
    expect(repositoryMode(undefined)).toBe("local");
    expect(repositoryMode("local")).toBe("local");
    expect(repositoryMode("http")).toBe("http");
  });
});

describe("LocalStorageRepository", () => {
  const users: UserRepository = new LocalStorageRepository();
  const events: EventRepository = new LocalStorageRepository();
  const attendance: AttendanceRepository = new LocalStorageRepository();

  beforeEach(() => {
    localStorage.clear();
  });

  it("signs in the seeded student and ignores a requested role", async () => {
    const signedIn = await users.authenticateUser({
      email: "student@howard.edu",
      password: "password123",
      role: "student",
    });
    expect(signedIn.ok).toBe(true);
    if (signedIn.ok) expect(signedIn.user.name).toBe("Campus Student");

    // The role comes from the stored account (F1.5), so asking for officer still signs in a student.
    const askedForOfficer = await users.authenticateUser({
      email: "student@howard.edu",
      password: "password123",
      role: "org_officer",
    });
    expect(askedForOfficer.ok).toBe(true);
    if (askedForOfficer.ok) expect(askedForOfficer.user.role).toBe("student");
  });

  it("persists a new account and refuses a duplicate email", async () => {
    const created = await users.createUser({
      email: "New.Student@howard.edu",
      password: "secret",
      name: "New Student",
      role: "student",
    });
    expect(created.ok).toBe(true);

    const again = await users.createUser({
      email: "new.student@howard.edu",
      password: "secret",
      name: "New Student",
      role: "student",
    });
    expect(again).toEqual({ ok: false, error: "Account already exists for this email." });

    const signedIn = await users.authenticateUser({
      email: "new.student@howard.edu",
      password: "secret",
      role: "student",
    });
    expect(signedIn.ok).toBe(true);
  });

  it("lists seeded events and puts a published event first", async () => {
    expect(events.listEvents().some((event) => event.title === "Welcome Week Block Party")).toBe(true);
    expect(events.listOrganizations().some((org) => org.name === "Student Union")).toBe(true);

    const created = await events.createEvent({
      title: "Lab Showcase",
      description: "Demo night",
      image: "/flyers/lab.png",
      category: "academic",
      date: "Fri, Oct 3",
      time: "6:00 PM",
      location: "iLab",
      capacity: 40,
      tags: ["demo"],
      creatorName: "Campus Officer",
      creatorRole: "org_officer",
      creatorUserId: "user-admin-1",
    });

    expect(events.listEvents()[0]?.id).toBe(created.id);
    expect(created.capacity).toBe(40);
  });

  it("stores an RSVP and includes that event in attendance exports", async () => {
    const eventId = events.listEvents()[0]?.id ?? "";
    expect(await attendance.toggleRsvp(eventId, "user-student-1")).toBe(true);
    expect(attendance.isRsvped(eventId, "user-student-1")).toBe(true);
    expect(localStorage.getItem("flyer_rsvp_v1")).toContain(eventId);
    expect(attendance.reminderMapForUser("user-student-1")[eventId]).toBe(true);

    expect(attendance.listAttendance().length).toBeGreaterThan(0);
    expect(attendance.summarizeAttendance()[0]?.eventTitle).toBeTruthy();
    expect(attendance.exportAttendanceCsv()).toContain("record_id");
  });

  it("issues a check-in token and turns a reminder off", async () => {
    expect(events.listCatalog().some((event) => event.title === "Welcome Week Block Party")).toBe(true);
    const issued = await attendance.issueCheckInToken("1", "user-student-1");
    const validated = await attendance.validateCheckInToken(issued.token);
    expect(validated).toEqual({ ok: true, eventId: "1", userId: "user-student-1" });

    await attendance.toggleRsvp("2", "user-student-1");
    await attendance.setReminderEnabled("2", "user-student-1", false);
    expect(attendance.reminderEvents(events.listEvents(), "user-student-1")).toEqual([]);
  });
});

describe("HttpRepository", () => {
  it("loads the cache from the API and reads it through the same interfaces", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const path = new URL(String(input)).pathname;
      const routes: Record<string, unknown> = {
        "/events": [{ id: "api-1", title: "API Night" }],
        "/organizations": [{ id: "1", name: "CS Society" }],
        "/attendance": [],
        "/rsvps": [{ eventId: "api-1", userId: "user-1" }],
        "/reminders": { "user-1": { "api-1": true } },
      };
      const body = routes[path];
      if (!body) return jsonResponse({ error: "missing" }, 404);
      return jsonResponse(body);
    };

    const http = new HttpRepository("http://api.test", fetchImpl);
    await http.load();

    const events: EventRepository = http;
    const attendance: AttendanceRepository = http;
    expect(events.listEvents().map((event) => event.title)).toEqual(["API Night"]);
    expect(events.listOrganizations()[0]?.name).toBe("CS Society");
    expect(attendance.isRsvped("api-1", "user-1")).toBe(true);
  });

  it("falls back to localStorage when the API cannot be reached", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("offline");
    };
    localStorage.clear();
    const repositories = await openHttpRepositories("http://api.test", fetchImpl);
    const signedIn = await repositories.users.authenticateUser({
      email: "student@howard.edu",
      password: "password123",
      role: "student",
    });
    expect(signedIn.ok).toBe(true);
    expect(localStorage.getItem("flyer_db_v1")).toContain("student@howard.edu");
  });

  it("sends writes to the API and updates the cache", async () => {
    const routes: Record<string, unknown> = {
      "/events": [],
      "/organizations": [],
      "/attendance": [{ id: "a1", eventTitle: 'Say "hi"' }],
      "/rsvps": [{ eventId: "api-1", userId: "user-1" }],
      "/reminders": {},
    };
    const fetchImpl: typeof fetch = async (input, init) => {
      const path = new URL(String(input)).pathname;
      if (init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as { eventId?: string };
        if (path === "/users") return jsonResponse({ ok: true, user: { id: "u2", name: "New" } });
        if (path === "/sessions") return jsonResponse("nope", 500);
        if (path === "/events") return jsonResponse({ id: "posted", title: "Posted" });
        if (path === "/rsvps/toggle") return jsonResponse({ rsvped: body.eventId === "on" });
        if (path === "/reminders") return jsonResponse({});
        if (path === "/check-in/tokens") return jsonResponse({ token: "tok", expiresAt: 5 });
        if (path === "/check-in/validate") return jsonResponse({ ok: true, eventId: "1", userId: "u" });
        return jsonResponse({ error: "missing" }, 404);
      }
      const body = routes[path];
      if (!body) return jsonResponse({ error: "missing" }, 500);
      return jsonResponse(body);
    };

    const http = new HttpRepository("http://api.test", fetchImpl);
    await http.load();
    expect((await http.createUser({ email: "a@howard.edu", password: "pw", name: "A", role: "student" })).ok).toBe(true);
    expect(await http.authenticateUser({ email: "a@howard.edu", password: "pw", role: "student" })).toEqual({
      ok: false,
      error: "Could not sign in.",
    });

    const created = await http.createEvent({
      title: "Posted",
      description: "From the API",
      image: "/flyers/lab.png",
      category: "academic",
      date: "Fri, Oct 3",
      time: "6:00 PM",
      location: "iLab",
      capacity: 10,
      tags: [],
      creatorName: "Officer",
      creatorRole: "org_officer",
    });
    expect(http.listEvents()[0]?.id).toBe(created.id);
    expect(http.listCatalog()[0]?.id).toBe(created.id);
    expect(http.exportAttendanceCsv()).toContain('Say ""hi""');

    expect(await http.toggleRsvp("on", "user-1")).toBe(true);
    expect(http.isRsvped("on", "user-1")).toBe(true);
    expect(await http.toggleRsvp("api-1", "user-1")).toBe(false);
    expect(http.isRsvped("api-1", "user-1")).toBe(false);

    await http.setReminderEnabled("on", "user-1", false);
    expect(http.reminderMapForUser("user-1").on).toBe(false);
    expect(http.reminderEvents([{ id: "on" } as EventRecord], "user-1")).toEqual([]);
    expect(await http.issueCheckInToken("1", "u")).toEqual({ token: "tok", expiresAt: 5 });
    expect(await http.validateCheckInToken("tok")).toEqual({ ok: true, eventId: "1", userId: "u" });
  });

  it("reports a failed read and a failed write", async () => {
    const failing: typeof fetch = async () => jsonResponse({ error: "down" }, 503);
    await expect(new HttpRepository("http://api.test", failing).load()).rejects.toThrow("GET /events failed (503)");

    const http = new HttpRepository("http://api.test", async (...args) => {
      const init = args[1];
      if (init?.method === "POST") return jsonResponse({ error: "no" }, 500);
      return jsonResponse([]);
    });
    await http.load();
    await expect(http.createEvent({
      title: "Nope",
      description: "Fails",
      image: "/x.png",
      category: "social",
      date: "Fri",
      time: "1:00 PM",
      location: "Quad",
      capacity: 1,
      tags: [],
      creatorName: "Officer",
      creatorRole: "org_officer",
    })).rejects.toThrow("POST /events failed (500)");
  });
});
