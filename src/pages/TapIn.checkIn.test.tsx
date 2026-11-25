import { beforeEach, describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getDatabase } from "@/data/appDatabase";
import { issueDynamicCheckInToken } from "@/data/checkInStore";
import { AuthProvider } from "@/contexts/AuthContext";
import { createLoggedInSession, saveSession } from "@/services/authService";
import TapIn from "@/pages/TapIn";

const renderOfficerScanner = () => {
  saveSession(createLoggedInSession("org_officer", "Campus Officer", {
    email: "officer@howard.edu",
    userId: "user-admin-1",
  }));
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AuthProvider>
          <TapIn />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("validated check-in persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("issues a token, scans it, and saves the event's configured points", () => {
    renderOfficerScanner();
    const issued = issueDynamicCheckInToken("2", "user-student-1");

    fireEvent.change(screen.getByLabelText("Scanned QR payload"), { target: { value: issued.token } });
    fireEvent.click(screen.getByRole("button", { name: "Validate Attendance" }));

    const saved = getDatabase().attendance.find(
      (row) => row.eventId === "2" && row.attendeeId === "user-student-1",
    );
    expect(saved).toMatchObject({
      eventTitle: "24-Hour Hackathon",
      attendeeName: "Campus Student",
      attendeeEmail: "student@howard.edu",
      orgName: "CS Society",
      pointsAwarded: 15,
    });
    expect(screen.getByText(/Campus Student checked in for 24-Hour Hackathon\. \+15 pts/)).toBeInTheDocument();

    const second = issueDynamicCheckInToken("2", "user-student-1");
    fireEvent.change(screen.getByLabelText("Scanned QR payload"), { target: { value: second.token } });
    fireEvent.click(screen.getByRole("button", { name: "Validate Attendance" }));

    const matches = getDatabase().attendance.filter(
      (row) => row.eventId === "2" && row.attendeeId === "user-student-1",
    );
    expect(matches).toHaveLength(1);
    expect(screen.getByText("This student is already checked in for this event.")).toBeInTheDocument();
  });
});
