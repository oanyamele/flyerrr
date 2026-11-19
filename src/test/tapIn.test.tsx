/**
 * F6.3 (#32): check-in is QR only. The screen must not claim NFC support,
 * and the main button must open the student's QR code.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { getDatabase } from "@/data/appDatabase";
import { AUTH_STORAGE_KEY } from "@/services/authService";
import TapIn from "@/pages/TapIn";

const renderAs = (session: object) => {
  getDatabase();
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/tap-in"]}>
          <TapIn />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
};

const student = { isLoggedIn: true, role: "student", userName: "Campus Student", email: "student@howard.edu", userId: "user-student-1" };
const officer = { isLoggedIn: true, role: "org_officer", userName: "Campus Officer", email: "officer@howard.edu", userId: "user-admin-1" };

describe("Check In screen", () => {
  beforeEach(() => localStorage.clear());

  it.each([["student", student], ["officer", officer]])("makes no NFC claims for a %s", (_label, session) => {
    const { container } = renderAs(session);
    expect(container.textContent).not.toMatch(/nfc|iphone|simulate|tap in/i);
  });

  it("opens the student's check-in QR from the main button", () => {
    renderAs(student); 
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); 
    fireEvent.click(screen.getByRole("button", { name: /show my check-in qr/i }));
    expect(screen.getByRole("dialog", { name: "Check-In QR" })).toBeInTheDocument(); 
    expect(screen.getByRole("img", { name: /QR check-in code for/ })).toBeInTheDocument();
  });

  it("labels the bottom tab Check In", () => {
    renderAs(student);
    expect(screen.getByRole("button", { name: "Check In" })).toBeInTheDocument();
  });
});
