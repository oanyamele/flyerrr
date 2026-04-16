export interface AttendanceRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  orgId: string;
  orgName: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  checkedInAt: string;
  pointsAwarded: number;
}

export interface AttendanceSummary {
  eventId: string;
  eventTitle: string;
  orgName: string;
  totalAttendees: number;
  avgPointsAwarded: number;
  lastCheckInAt: string;
}

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: "a1",
    eventId: "1",
    eventTitle: "Welcome Week Block Party",
    orgId: "4",
    orgName: "Student Union",
    attendeeId: "u100",
    attendeeName: "Maya Thompson",
    attendeeEmail: "maya.thompson@howard.edu",
    checkedInAt: "2025-09-12T18:15:00.000Z",
    pointsAwarded: 10,
  },
  {
    id: "a2",
    eventId: "2",
    eventTitle: "24-Hour Hackathon",
    orgId: "1",
    orgName: "CS Society",
    attendeeId: "u101",
    attendeeName: "Jordan Lee",
    attendeeEmail: "jordan.lee@howard.edu",
    checkedInAt: "2025-09-20T10:05:00.000Z",
    pointsAwarded: 15,
  },
  {
    id: "a3",
    eventId: "3",
    eventTitle: "Fall Career Fair",
    orgId: "2",
    orgName: "Career Center",
    attendeeId: "u102",
    attendeeName: "Alex Rivera",
    attendeeEmail: "alex.rivera@howard.edu",
    checkedInAt: "2025-09-24T13:12:00.000Z",
    pointsAwarded: 10,
  },
  {
    id: "a4",
    eventId: "4",
    eventTitle: "Volleyball Open Gym",
    orgId: "3",
    orgName: "Intramural Sports",
    attendeeId: "u103",
    attendeeName: "Taylor Brooks",
    attendeeEmail: "taylor.brooks@howard.edu",
    checkedInAt: "2025-09-17T19:02:00.000Z",
    pointsAwarded: 5,
  },
  {
    id: "a5",
    eventId: "5",
    eventTitle: "Game Night in Blackburn",
    orgId: "4",
    orgName: "Student Union",
    attendeeId: "u104",
    attendeeName: "Chris Porter",
    attendeeEmail: "chris.porter@howard.edu",
    checkedInAt: "2025-09-19T20:14:00.000Z",
    pointsAwarded: 8,
  },
];

const csvHeaders = [
  "record_id",
  "event_id",
  "event_title",
  "org_id",
  "org_name",
  "attendee_id",
  "attendee_name",
  "attendee_email",
  "checked_in_at",
  "points_awarded",
];

const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export const buildAttendanceCsv = (records: AttendanceRecord[]) => {
  const lines = records.map((record) =>
    [
      record.id,
      record.eventId,
      record.eventTitle,
      record.orgId,
      record.orgName,
      record.attendeeId,
      record.attendeeName,
      record.attendeeEmail,
      record.checkedInAt,
      record.pointsAwarded,
    ]
      .map(quote)
      .join(","),
  );

  return [csvHeaders.join(","), ...lines].join("\n");
};

export const getAttendanceSummary = (records: AttendanceRecord[]): AttendanceSummary[] => {
  const summaryMap = new Map<string, AttendanceSummary & { totalPoints: number }>();

  records.forEach((record) => {
    const existing = summaryMap.get(record.eventId);
    if (!existing) {
      summaryMap.set(record.eventId, {
        eventId: record.eventId,
        eventTitle: record.eventTitle,
        orgName: record.orgName,
        totalAttendees: 1,
        totalPoints: record.pointsAwarded,
        avgPointsAwarded: record.pointsAwarded,
        lastCheckInAt: record.checkedInAt,
      });
      return;
    }

    existing.totalAttendees += 1;
    existing.totalPoints += record.pointsAwarded;
    existing.avgPointsAwarded = Number((existing.totalPoints / existing.totalAttendees).toFixed(1));
    if (new Date(record.checkedInAt) > new Date(existing.lastCheckInAt)) {
      existing.lastCheckInAt = record.checkedInAt;
    }
  });

  return Array.from(summaryMap.values())
    .map(({ totalPoints: _totalPoints, ...summary }) => summary)
    .sort((a, b) => b.totalAttendees - a.totalAttendees);
};
