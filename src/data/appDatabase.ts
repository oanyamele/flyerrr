import { attendanceRecords, type AttendanceRecord } from "@/data/attendanceStore";
import { mockEvents, type CampusEvent } from "@/data/mockEvents";

export type UserRole = "student" | "org_officer";

export interface AppUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  metadata: {
    major?: string;
    graduationYear?: string;
    notificationsEnabled: boolean;
  };
}

export interface EventRecord extends CampusEvent {
  createdAt: string;
  createdByUserId?: string;
}

export interface VerificationRecord {
  id: string;
  orgName: string;
  submittedByEmail: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface DatabaseMetadata {
  schemaVersion: number;
  seededAt: string;
  lastUpdatedAt: string;
}

export interface AppDatabase {
  users: AppUser[];
  events: EventRecord[];
  attendance: AttendanceRecord[];
  verifications: VerificationRecord[];
  metadata: DatabaseMetadata;
}

const DB_KEY = "flyer_db_v1";

const nowIso = () => new Date().toISOString();

const toSeedEvent = (event: CampusEvent): EventRecord => ({
  ...event,
  createdAt: nowIso(),
});

const defaultDatabase = (): AppDatabase => ({
  users: [
    {
      id: "user-admin-1",
      email: "officer@howard.edu",
      password: "password123",
      name: "Campus Officer",
      role: "org_officer",
      createdAt: nowIso(),
      lastLoginAt: nowIso(),
      metadata: { notificationsEnabled: true },
    },
    {
      id: "user-student-1",
      email: "student@howard.edu",
      password: "password123",
      name: "Campus Student",
      role: "student",
      createdAt: nowIso(),
      lastLoginAt: nowIso(),
      metadata: { notificationsEnabled: true },
    },
  ],
  events: mockEvents.map(toSeedEvent),
  attendance: attendanceRecords,
  verifications: [
    {
      id: "verification-1",
      orgName: "Women in Product",
      submittedByEmail: "wip@howard.edu",
      submittedAt: nowIso(),
      status: "pending",
    },
  ],
  metadata: {
    schemaVersion: 1,
    seededAt: nowIso(),
    lastUpdatedAt: nowIso(),
  },
});

const safeRead = () => {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppDatabase;
  } catch {
    return null;
  }
};

export const createDefaultDatabase = (): AppDatabase => defaultDatabase();

/** Persists a database snapshot and stamps metadata.lastUpdatedAt. */
export const saveDatabase = (db: AppDatabase) => {
  const next = {
    ...db,
    metadata: {
      ...db.metadata,
      lastUpdatedAt: nowIso(),
    },
  };
  localStorage.setItem(DB_KEY, JSON.stringify(next));
  return next;
};

const syncSeedEvents = (db: AppDatabase) => {
  const seedById = new Map(mockEvents.map((event) => [event.id, event]));
  let changed = false;

  const nextEvents = db.events.map((event) => {
    const seeded = seedById.get(event.id);
    if (!seeded) return event;

    const synced = {
      ...event,
      ...seeded,
      createdAt: event.createdAt,
      createdByUserId: event.createdByUserId,
    };
    if (JSON.stringify(synced) !== JSON.stringify(event)) changed = true;
    return synced;
  });

  const existingIds = new Set(nextEvents.map((event) => event.id));
  const missingSeededEvents = mockEvents
    .filter((event) => !existingIds.has(event.id))
    .map(toSeedEvent);

  if (missingSeededEvents.length > 0) {
    changed = true;
    nextEvents.push(...missingSeededEvents);
  }

  if (!changed) return db;
  return saveDatabase({ ...db, events: nextEvents });
};

/** Storage engine for the local adapter. Pages should depend on src/repositories instead. */
export const getDatabase = (): AppDatabase => {
  const existing = safeRead();
  if (existing) return syncSeedEvents(existing);
  const seed = defaultDatabase();
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
};
