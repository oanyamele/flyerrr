/**
 * F1.5 (#16): offline demo mode must not keep plaintext passwords, must not let
 * anyone sign up as an officer, and must not trust a hand-edited session.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { authenticateUser, createUser, getDatabase } from "@/data/appDatabase";
import { AUTH_STORAGE_KEY } from "@/services/authService";

const DB_KEY = "flyer_db_v1";
// Same seed password the existing fixtures use; it only lives in test code.
const SEED_PASSWORD = "password123";
const storedDb = () => localStorage.getItem(DB_KEY) ?? "";

describe("offline accounts", () => {
  beforeEach(() => localStorage.clear());

  it("never writes a plaintext password to localStorage", async () => {
    const result = await createUser({ email: "New@Howard.edu", password: "Correct-Horse-9", name: "New Student" });
    expect(result.ok).toBe(true);
    expect(storedDb()).not.toContain("Correct-Horse-9");
    expect(storedDb()).not.toContain(SEED_PASSWORD);
  });

  it("always creates students, even when a role is smuggled into the input", async () => {
    const input = { email: "sneaky@howard.edu", password: "Sneaky-Pass-1", name: "Sneaky", role: "org_officer" };
    const result = await createUser(input);
    expect(result.ok && result.user.role).toBe("student");
  });

  it("signs in with the right password and rejects a wrong one", async () => {
    await createUser({ email: "pat@howard.edu", password: "Right-Pass-1", name: "Pat" });
    expect((await authenticateUser({ email: "pat@howard.edu", password: "Wrong-Pass-1" })).ok).toBe(false);
    expect((await authenticateUser({ email: " PAT@howard.edu ", password: "Right-Pass-1" })).ok).toBe(true);
  });

  it("takes the role from the stored account", async () => {
    const officer = await authenticateUser({ email: "officer@howard.edu", password: SEED_PASSWORD });
    const student = await authenticateUser({ email: "student@howard.edu", password: SEED_PASSWORD });
    expect(officer.ok && officer.user.role).toBe("org_officer");
    expect(student.ok && student.user.role).toBe("student");
  });

  it("migrates pre-F1.5 plaintext records", async () => {
    getDatabase();
    const legacy = JSON.parse(storedDb());
    legacy.users = legacy.users.map(({ passwordHash: _h, passwordSalt: _s, ...user }: Record<string, unknown>) => ({ ...user, password: SEED_PASSWORD }));
    legacy.users.push({ ...legacy.users[1], id: "user-legacy", email: "legacy@howard.edu", password: "Old-Plain-1" });
    localStorage.setItem(DB_KEY, JSON.stringify(legacy));

    // Seed accounts are reset to the hashed seed on the next read.
    getDatabase();
    expect(storedDb()).not.toContain(SEED_PASSWORD);
    expect((await authenticateUser({ email: "officer@howard.edu", password: SEED_PASSWORD })).ok).toBe(true);

    // Other accounts are upgraded at their next sign-in.
    expect(storedDb()).toContain("Old-Plain-1");
    expect((await authenticateUser({ email: "legacy@howard.edu", password: "Old-Plain-1" })).ok).toBe(true);
    expect(storedDb()).not.toContain("Old-Plain-1");
    expect((await authenticateUser({ email: "legacy@howard.edu", password: "Old-Plain-1" })).ok).toBe(true);
  });
});

const Probe = () => {
  const { auth } = useAuth();
  return <p>{auth.isLoggedIn ? `in:${auth.role}` : "out"}</p>;
};

const renderWithSession = (session: object) => {
  getDatabase();
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
};

describe("editing localStorage cannot grant officer access offline", () => {
  beforeEach(() => localStorage.clear());

  it("rejects a forged officer session for an unknown account", () => {
    renderWithSession({ isLoggedIn: true, role: "org_officer", userName: "Forged", userId: "forged-officer" });
    expect(screen.getByText("out")).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("rejects a student session whose role was edited to officer", () => {
    renderWithSession({ isLoggedIn: true, role: "org_officer", userName: "Campus Student", userId: "user-student-1" });
    expect(screen.getByText("out")).toBeInTheDocument();
  });

  it("keeps a genuine session", () => {
    renderWithSession({ isLoggedIn: true, role: "org_officer", userName: "Campus Officer", userId: "user-admin-1" });
    expect(screen.getByText("in:org_officer")).toBeInTheDocument();
  });
});
