import { describe, expect, it } from "vitest";
import { buildAttendanceCsv, getAttendanceSummary, type AttendanceRecord } from "@/data/attendanceStore";

const record = (overrides: Partial<AttendanceRecord>): AttendanceRecord => ({
  id: "a",
  eventId: "1",
  eventTitle: "Welcome Week",
  orgId: "4",
  orgName: "Student Union",
  attendeeId: "u1",
  attendeeName: "Maya Thompson",
  attendeeEmail: "maya@howard.edu",
  checkedInAt: "2025-09-12T18:00:00.000Z",
  pointsAwarded: 10,
  ...overrides,
});

describe("attendance summary and csv", () => {
  it("returns no rows for an empty list", () => {
    expect(getAttendanceSummary([])).toEqual([]);
    expect(buildAttendanceCsv([])).toBe(
      "record_id,event_id,event_title,org_id,org_name,attendee_id,attendee_name,attendee_email,checked_in_at,points_awarded",
    );
  });

  it("averages points, keeps the latest check-in, and sorts by attendance", () => {
    const summary = getAttendanceSummary([
      record({ id: "a1", pointsAwarded: 10, checkedInAt: "2025-09-12T18:00:00.000Z" }),
      record({
        id: "a2",
        attendeeId: "u2",
        pointsAwarded: 5,
        checkedInAt: "2025-09-12T17:00:00.000Z",
      }),
      record({
        id: "a3",
        attendeeId: "u4",
        pointsAwarded: 10,
        checkedInAt: "2025-09-12T19:00:00.000Z",
      }),
      record({
        id: "b1",
        eventId: "2",
        eventTitle: "Hackathon",
        attendeeId: "u3",
        pointsAwarded: 15,
        checkedInAt: "2025-09-20T10:00:00.000Z",
      }),
    ]);

    expect(summary.map((row) => row.eventId)).toEqual(["1", "2"]);
    expect(summary[0]).toMatchObject({
      totalAttendees: 3,
      avgPointsAwarded: 8.3,
      lastCheckInAt: "2025-09-12T19:00:00.000Z",
    });
    expect(summary[1]).toMatchObject({ totalAttendees: 1, avgPointsAwarded: 15 });
  });

  it("escapes quotes inside csv fields", () => {
    const csv = buildAttendanceCsv([
      record({ eventTitle: 'Say "hello", friend', attendeeName: 'Alex "A" Rivera' }),
    ]);
    expect(csv).toContain('"Say ""hello"", friend"');
    expect(csv).toContain('"Alex ""A"" Rivera"');
  });
});
