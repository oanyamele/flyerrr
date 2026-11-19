import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FollowProvider } from "@/contexts/FollowContext";
import EventDetail from "@/pages/EventDetail";

const GoToMissingEvent = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/event/does-not-exist")}>
      Open missing event
    </button>
  );
};

const renderEventRoute = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <FollowProvider>
          <Routes>
            <Route
              path="/event/:id"
              element={
                <>
                  <EventDetail />
                  <GoToMissingEvent />
                </>
              }
            />
          </Routes>
        </FollowProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("EventDetail missing event", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the empty state for an unknown event id", () => {
    renderEventRoute("/event/does-not-exist");
    expect(screen.getByText("Event not found")).toBeInTheDocument();
  });

  it("keeps the same page mounted when navigating from a valid event to a missing id", () => {
    renderEventRoute("/event/1");
    expect(screen.getByRole("heading", { name: "Welcome Week Block Party" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open missing event" }));

    expect(screen.getByText("Event not found")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Welcome Week Block Party" })).not.toBeInTheDocument();
  });
});
