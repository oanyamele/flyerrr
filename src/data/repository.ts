/**
 * Async repository layer (F6.1).
 * Pages read data through these functions so they can render loading, empty
 * and error states uniformly. Storage failures surface as DataAccessError
 * instead of being silently treated as "no data".
 */
import { getDatabase, type EventRecord } from "@/data/appDatabase";
import { getAttendanceSummary, type AttendanceRecord, type AttendanceSummary } from "@/data/attendanceStore";
import { getReminderEvents } from "@/data/checkInStore";

export class DataAccessError extends Error {
  constructor(message = "We couldn't load this data.") {
    super(message);
    this.name = "DataAccessError";
  }
}

const DB_KEY = "flyer_db_v1";

/** Fails loudly when stored data is unreadable, rather than reseeding over it. */
const loadDatabase = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) JSON.parse(raw);
    return getDatabase();
  } catch {
    throw new DataAccessError();
  }
};

const run = <T,>(fn: () => T): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    try {
      resolve(fn());
    } catch (err) {
      reject(err instanceof DataAccessError ? err : new DataAccessError());
    }
  });

export const fetchEvents = () => run(() => loadDatabase().events);

export const fetchSavedEvents = () => run(() => loadDatabase().events.filter((e) => e.saved));

export const fetchAttendanceForUser = (userId: string | null) =>
  run<AttendanceRecord[]>(() =>
    userId
      ? loadDatabase()
          .attendance.filter((r) => r.attendeeId === userId)
          .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
      : [],
  );

export const fetchAttendanceReport = () =>
  run<{ records: AttendanceRecord[]; summary: AttendanceSummary[] }>(() => {
    const records = loadDatabase().attendance;
    return { records, summary: getAttendanceSummary(records) };
  });

export const fetchReminderEvents = (userId: string) =>
  run<EventRecord[]>(() => getReminderEvents(loadDatabase().events, userId));

export interface UserStats {
  eventsAttended: number;
  points: number;
  categoriesAttended: number;
  distinctWeeks: number;
}

export const computeUserStats = (records: AttendanceRecord[], events: EventRecord[]): UserStats => {
  const categoryById = new Map(events.map((e) => [e.id, e.category]));
  const categories = new Set(records.map((r) => categoryById.get(r.eventId)).filter(Boolean));
  const weeks = new Set(records.map((r) => Math.floor(new Date(r.checkedInAt).getTime() / (7 * 864e5))));
  return {
    eventsAttended: records.length,
    points: records.reduce((sum, r) => sum + r.pointsAwarded, 0),
    categoriesAttended: categories.size,
    distinctWeeks: weeks.size,
  };
};

export const fetchUserStats = (userId: string | null) =>
  run<UserStats>(() => {
    const db = loadDatabase();
    const records = userId ? db.attendance.filter((r) => r.attendeeId === userId) : [];
    return computeUserStats(records, db.events);
  });
