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
