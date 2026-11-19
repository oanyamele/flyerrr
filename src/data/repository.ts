/**
 * Async repository layer (F6.1).
 * Pages read data through these functions so they can render loading, empty
 * and error states uniformly. Storage failures surface as DataAccessError
 * instead of being silently treated as "no data".
 */
import { createEventRecord, getDatabase, type EventRecord } from "@/data/appDatabase";
import { getAttendanceSummary, type AttendanceRecord, type AttendanceSummary } from "@/data/attendanceStore";
import { getReminderEvents } from "@/data/checkInStore";
import { STORAGE_KEYS, readString } from "@/lib/storage";
import { apiRequest, ApiError, useHttpBackend } from "@/services/httpApi";

export class DataAccessError extends Error {
  constructor(message = "We couldn't load this data.") {
    super(message);
    this.name = "DataAccessError";
  }
}

/** Fails loudly when stored data is unreadable, rather than reseeding over it. */
const loadDatabase = () => {
  try {
    const raw = readString(STORAGE_KEYS.database);
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

export const fetchEvents = () => useHttpBackend ? apiRequest<EventRecord[]>("/events") : run(() => loadDatabase().events);

export const fetchEvent = async (id: string): Promise<EventRecord | null> => {
  if (!useHttpBackend) return run(() => loadDatabase().events.find(event => event.id === id) ?? null);
  try { return await apiRequest(`/events/${encodeURIComponent(id)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
};

export const saveNewEvent = (input: Parameters<typeof createEventRecord>[0] & { startsAt?: string; timezone?: string }) =>
  useHttpBackend ? apiRequest<EventRecord>("/events", { method: "POST", body: JSON.stringify(input) }) : run(() => {
    // Check the existing data before createEventRecord can reseed corrupt storage.
    loadDatabase();
    return createEventRecord(input);
  });

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
