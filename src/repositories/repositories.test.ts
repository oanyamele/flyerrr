import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { createAppRepositories } from "./createAppRepositories";
import { createInMemoryDatabase } from "./inMemoryDatabase";

const DB_KEY = "flyer_db_v1";

const pagesDecoupledFromStorage = [
  "src/pages/Login.tsx",
  "src/pages/Index.tsx",
  "src/pages/CreateEvent.tsx",
  "src/pages/EventDetail.tsx",
  "src/pages/TapIn.tsx",
  "src/pages/EventReminders.tsx",
];

describe("repository seam", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps route components off the storage module", () => {
    for (const page of pagesDecoupledFromStorage) {
      expect(readFileSync(page, "utf8")).not.toContain("@/data/appDatabase");
    }
  });

  it("signs in a seeded student and rejects the same password for the other role", () => {
    const { users } = createAppRepositories();

    const student = users.authenticate({
      email: "  Student@Howard.edu ",
      password: "password123",
      role: "student",
    });

    expect(student.ok).toBe(true);
    if (!student.ok) return;
    expect(student.user.email).toBe("student@howard.edu");
    expect(student.user.id).toBe("user-student-1");

    expect(
      users.authenticate({
        email: "student@howard.edu",
        password: "password123",
        role: "org_officer",
      }),
    ).toEqual({ ok: false, error: "Invalid email, password, or role." });
  });

  it("creates an account once, persists it, and rejects a duplicate email", () => {
    const created = createAppRepositories().users.create({
      email: "New@Howard.edu",
      password: "secret",
      name: "  New Student  ",
      role: "student",
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.user.email).toBe("new@howard.edu");
    expect(created.user.name).toBe("New Student");

    const duplicate = createAppRepositories().users.create({
      email: "new@howard.edu",
      password: "other",
      name: "Other",
      role: "org_officer",
    });
    expect(duplicate).toEqual({ ok: false, error: "Account already exists for this email." });

    const signedIn = createAppRepositories().users.authenticate({
      email: "new@howard.edu",
      password: "secret",
      role: "student",
    });
    expect(signedIn.ok).toBe(true);
  });

  it("publishes an event at the front of the catalog and keeps the seeded events", () => {
    const { events } = createAppRepositories();
    const before = events.list().length;

    const created = events.create({
      title: "Lab Showcase",
      description: "Demo",
      image: "https://example.com/a.jpg",
      category: "academic",
      date: "2026-11-01",
      time: "18:00",
      location: "Blackburn",
      capacity: 0,
      tags: ["demo"],
      creatorName: "Campus Officer",
      creatorRole: "org_officer",
      creatorUserId: "user-admin-1",
    });

    const listed = createAppRepositories().events.list();
    expect(listed[0]).toMatchObject({
      id: created.id,
      title: "Lab Showcase",
      capacity: 100,
      org: { name: "Campus Officer Org", verified: false },
    });
    expect(listed).toHaveLength(before + 1);
  });

  it("runs the same use cases against memory without writing localStorage", () => {
    const repositories = createAppRepositories(createInMemoryDatabase());

    const created = repositories.users.create({
      email: "memory@howard.edu",
      password: "secret",
      name: "Memory User",
      role: "student",
    });
    expect(created.ok).toBe(true);
    expect(localStorage.getItem(DB_KEY)).toBeNull();

    const signedIn = repositories.users.authenticate({
      email: "memory@howard.edu",
      password: "secret",
      role: "student",
    });
    expect(signedIn.ok).toBe(true);

    const localUsers = createAppRepositories().users.authenticate({
      email: "memory@howard.edu",
      password: "secret",
      role: "student",
    });
    expect(localUsers.ok).toBe(false);
  });
});
