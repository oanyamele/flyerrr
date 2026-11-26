import { beforeEach, describe, expect, it, vi } from "vitest";

const httpMocks = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    body: Record<string, unknown>;
    constructor(message: string, status: number, body: Record<string, unknown> = {}) {
      super(message);
      this.status = status;
      this.body = body;
    }
  }
  return { apiRequest: vi.fn(), ApiError, useHttpBackend: true as const };
});

vi.mock("@/services/httpApi", () => httpMocks);

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import TapIn from "@/pages/TapIn";

const { apiRequest: request, ApiError } = httpMocks;

const event = { id: "e1", title: "Hack Night" };
const officer = { isLoggedIn: true, userId: "o1", userName: "Officer", email: "officer@howard.edu", role: "org_officer" };
const student = { isLoggedIn: true, userId: "s1", userName: "Maya", email: "maya@bison.howard.edu", role: "student" };

const renderTapIn = () => render(
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>
      <AuthProvider>
        <TapIn />
      </AuthProvider>
    </MemoryRouter>
  </QueryClientProvider>,
);

describe("check-in through the server", () => {
  beforeEach(() => {
    localStorage.clear();
    request.mockReset();
  });

  it("lets an officer redeem a student's code, shows who checked in, and explains a refused code", async () => {
    let attendance: unknown[] = [];
    request.mockImplementation(async (path: string, init?: { method?: string; body?: string }) => {
      if (path === "/auth/session") return officer;
      if (path === "/events") return [event];
      if (path === "/events/e1/attendance") return attendance;
      if (path === "/events/e1/check-ins") {
        const { token } = JSON.parse(init?.body ?? "{}") as { token: string };
        if (token !== "good.code") throw new ApiError("This code was already used.", 409, { code: "already_used" });
        attendance = [{ userId: "s1", name: "Maya Student", email: "maya@bison.howard.edu", checkedInAt: "2030-01-01T15:00:00.000Z", checkedInBy: "o1" }];
        return { attendee: { userId: "s1", name: "Maya Student", email: "maya@bison.howard.edu" }, checkedInAt: "2030-01-01T15:00:00.000Z" };
      }
      throw new Error(`Unexpected request ${path}`);
    });
    renderTapIn();

    expect(await screen.findByRole("option", { name: "Hack Night" })).toBeInTheDocument();
    expect(await screen.findByText("No one has checked in yet.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Scanned QR payload"), { target: { value: "good.code" } });
    fireEvent.click(screen.getByRole("button", { name: "Validate Attendance" }));
    expect(await screen.findByText(/Maya Student checked in for Hack Night at /)).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith("/events/e1/check-ins", expect.objectContaining({ method: "POST", body: JSON.stringify({ token: "good.code" }) }));
    expect(await screen.findByRole("list", { name: "Checked-in attendees" })).toHaveTextContent("Maya Student");
    expect(screen.getByLabelText("Scanned QR payload")).toHaveValue("");
    // Nothing is written to the browser's own attendance store in server mode.
    const stored = localStorage.getItem("flyer_db_v1");
    expect(stored === null || (JSON.parse(stored) as { attendance: unknown[] }).attendance.length === 0).toBe(true);

    fireEvent.change(screen.getByLabelText("Scanned QR payload"), { target: { value: "replayed.code" } });
    fireEvent.click(screen.getByRole("button", { name: "Validate Attendance" }));
    expect(await screen.findByText("This code was already used.")).toBeInTheDocument();
    expect(screen.getByLabelText("Scanned QR payload")).toHaveValue("replayed.code");
  });

  it("tells the officer when the server cannot be reached", async () => {
    request.mockImplementation(async (path: string) => {
      if (path === "/auth/session") return officer;
      if (path === "/events") return [event];
      if (path === "/events/e1/attendance") return [];
      throw new TypeError("Failed to fetch");
    });
    renderTapIn();
    await screen.findByRole("option", { name: "Hack Night" });
    fireEvent.change(screen.getByLabelText("Scanned QR payload"), { target: { value: "x.y" } });
    fireEvent.click(screen.getByRole("button", { name: "Validate Attendance" }));
    expect(await screen.findByText("Couldn't reach the server. Try again.")).toBeInTheDocument();
  });

  it("shows a student the code the server issued for the selected event", async () => {
    request.mockImplementation(async (path: string) => {
      if (path === "/auth/session") return student;
      if (path === "/events") return [event];
      if (path === "/events/e1/check-in-tokens") return { token: "signed.payload", expiresAt: new Date(Date.now() + 120_000).toISOString() };
      throw new Error(`Unexpected request ${path}`);
    });
    renderTapIn();
    await screen.findByRole("option", { name: "Hack Night" });
    fireEvent.click(screen.getByRole("button", { name: "Open backup QR check-in" }));
    expect(await screen.findByTestId("check-in-code")).toHaveTextContent("signed.payload");
    expect(request).toHaveBeenCalledWith("/events/e1/check-in-tokens", { method: "POST" });
  });

  it("says so when the server will not issue a code", async () => {
    request.mockImplementation(async (path: string) => {
      if (path === "/auth/session") return student;
      if (path === "/events") return [event];
      throw new ApiError("Event not found.", 404);
    });
    renderTapIn();
    await screen.findByRole("option", { name: "Hack Night" });
    fireEvent.click(screen.getByRole("button", { name: "Open backup QR check-in" }));
    expect(await screen.findByText("Event not found.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("check-in-code")).toHaveTextContent("Generating code…"));
  });
});
