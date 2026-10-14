import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_STORAGE_KEY,
  clearSession,
  createLoggedInSession,
  isAuthSession,
  loadSession,
  loggedOutSession,
  saveSession,
  sessionFromUser,
} from "@/services/authService";
import type { AppUser } from "@/data/appDatabase";

describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a logged-out session when nothing is stored", () => {
    expect(loadSession()).toEqual(loggedOutSession());
  });

  it("round-trips a valid session through localStorage", () => {
    const session = createLoggedInSession("org_officer", "Campus Officer", {
      email: "officer@howard.edu",
      userId: "user-admin-1",
    });
    saveSession(session);
    expect(loadSession()).toEqual(session);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain("Campus Officer");
  });

  it("maps an AppUser onto a session without storing the password", () => {
    const user: AppUser = {
      id: "user-student-1",
      email: "student@howard.edu",
      password: "password123",
      name: "Campus Student",
      role: "student",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastLoginAt: "2026-01-01T00:00:00.000Z",
      metadata: { notificationsEnabled: true },
    };
    const session = sessionFromUser(user);
    expect(session).toMatchObject({
      isLoggedIn: true,
      role: "student",
      userName: "Campus Student",
      email: "student@howard.edu",
      userId: "user-student-1",
    });
    expect(JSON.stringify(session)).not.toContain("password123");
  });

  it("treats corrupt JSON as logged out instead of throwing", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "{not-json");
    expect(loadSession()).toEqual(loggedOutSession());
  });

  it("rejects malformed session objects", () => {
    expect(isAuthSession({ isLoggedIn: true, role: "admin", userName: "x" })).toBe(false);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role: "student" }));
    expect(loadSession()).toEqual(loggedOutSession());
  });

  it("clears the stored session on logout", () => {
    saveSession(createLoggedInSession("student", "Campus Student"));
    clearSession();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(loadSession()).toEqual(loggedOutSession());
  });
});
