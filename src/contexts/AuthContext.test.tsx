import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { AppUser } from "@/data/appDatabase";
import { AUTH_STORAGE_KEY } from "@/services/authService";

const student: AppUser = {
  id: "user-student-1",
  email: "student@howard.edu",
  passwordHash: "not-a-real-hash",
  passwordSalt: "not-a-real-salt",
  name: "Campus Student",
  role: "student",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: "2026-01-01T00:00:00.000Z",
  metadata: { notificationsEnabled: true },
};

const Probe = () => {
  const { auth, loginWithUser, logout } = useAuth();
  return (
    <div>
      <p>{auth.isLoggedIn ? auth.userName : "signed out"}</p>
      <button type="button" onClick={() => loginWithUser(student)}>Sign in as student</button>
      <button type="button" onClick={() => void logout()}>Sign out</button>
    </div>
  );
};

const renderAuth = () => {
  const client = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<AuthProvider><Probe /></AuthProvider>, { wrapper });
};

describe("auth flows", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // login(role, name) was removed in F1.5 because it signed in as any role without a password.
  it("signs in from an account and signs out", () => {
    renderAuth();
    expect(screen.getByText("signed out")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign in as student" }));
    expect(screen.getByText("Campus Student")).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain("student@howard.edu");
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toContain("not-a-real-hash");

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByText("signed out")).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("refuses to read auth outside the provider", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const Outside = () => {
      useAuth();
      return null;
    };
    expect(() => render(<Outside />)).toThrow("useAuth must be used within AuthProvider");
    error.mockRestore();
  });
});
