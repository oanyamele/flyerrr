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
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OrganizationVerificationQueue from "@/pages/OrganizationVerificationQueue";

const { apiRequest: request, ApiError } = httpMocks;

const item = (overrides: Record<string, unknown>) => ({
  id: "o1", orgName: "Women in Product", handle: "@wip", submittedBy: "Mina Hayes", schoolEmail: "mina@howard.edu",
  submittedAt: "2030-01-01T10:00:00.000Z", status: "pending", decidedAt: null, decidedBy: null, canDecide: true, ...overrides,
});

const renderQueue = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <OrganizationVerificationQueue />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe("organization verification through the server", () => {
  beforeEach(() => {
    // Braces matter: mockReset() returns the mock, and vitest would call a function returned
    // from beforeEach as cleanup after every test.
    request.mockReset();
  });

  it("shows the server's queue and saves an approval through the API", async () => {
    let rows = [item({ id: "o1" }), item({ id: "o2", orgName: "My Own Club", canDecide: false })];
    request.mockImplementation(async (path: string, init?: { method?: string; body?: string }) => {
      if (path === "/organization-verifications") return rows;
      if (path === "/organizations/o1/verification" && init?.method === "PUT") {
        rows = [item({ id: "o1", status: "approved", decidedBy: "Reviewer" }), rows[1]];
        return rows[0];
      }
      throw new Error(`Unexpected request ${path}`);
    });
    renderQueue();

    const first = (await screen.findByText("Women in Product")).closest("article")!;
    expect(screen.getByText("2 pending review")).toBeTruthy();
    // An organization the officer leads cannot be reviewed from here.
    const own = screen.getByText("My Own Club").closest("article")!;
    expect(within(own).queryByRole("button", { name: /approve/i })).toBeNull();
    expect(within(own).getByText(/another officer needs to review/i)).toBeTruthy();

    fireEvent.click(within(first).getByRole("button", { name: /approve/i }));
    await waitFor(() => expect(screen.getByText("1 pending review")).toBeTruthy());
    expect(request).toHaveBeenCalledWith("/organizations/o1/verification", { method: "PUT", body: JSON.stringify({ decision: "approved" }) });
    expect(within(first).getByText("approved")).toBeTruthy();
    expect(within(first).getByText(/decided by Reviewer/i)).toBeTruthy();
  });

  it("tells a signed-in student that only officers can review", async () => {
    request.mockRejectedValue(new ApiError("Only an organization officer can review organizations.", 403));
    renderQueue();
    expect((await screen.findByRole("alert")).textContent).toContain("Only an organization officer can review organizations.");
  });

  it("explains a decision that could not be saved and keeps the queue", async () => {
    request.mockImplementation(async (path: string, init?: { method?: string }) => {
      if (init?.method === "PUT") throw new ApiError("Unable to complete this request. Try again.", 500);
      if (path === "/organization-verifications") return [item({ id: "o1" })];
      throw new Error(`Unexpected request ${path}`);
    });
    renderQueue();
    fireEvent.click(within((await screen.findByText("Women in Product")).closest("article")!).getByRole("button", { name: /reject/i }));
    expect((await screen.findByRole("alert")).textContent).toContain("Could not save that decision");
    expect(screen.getByText("Women in Product")).toBeTruthy();
  });
});
