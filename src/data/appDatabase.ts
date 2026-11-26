import type { AttendanceRecord } from "@/data/attendanceStore";
import { mockEvents, mockOrgs, type CampusEvent, type EventCategory, type OrgProfile } from "@/data/mockEvents";

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
  checkInPoints?: number;
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
  attendance: [],
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

const writeDb = (db: AppDatabase) => {
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
  return writeDb({ ...db, events: nextEvents });
};

export const getDatabase = (): AppDatabase => {
  const existing = safeRead();
  if (existing) return syncSeedEvents(existing);
  const seed = defaultDatabase();
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
};

export const createUser = (input: { email: string; password: string; name: string; role: UserRole }) => {
  const db = getDatabase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const exists = db.users.some((user) => user.email.toLowerCase() === normalizedEmail);
  if (exists) return { ok: false as const, error: "Account already exists for this email." };

  const user: AppUser = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    password: input.password,
    name: input.name.trim(),
    role: input.role,
    createdAt: nowIso(),
    lastLoginAt: nowIso(),
    metadata: { notificationsEnabled: true },
  };

  writeDb({ ...db, users: [user, ...db.users] });
  return { ok: true as const, user };
};

export const authenticateUser = (input: { email: string; password: string; role: UserRole }) => {
  const db = getDatabase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const match = db.users.find(
    (user) =>
      user.email.toLowerCase() === normalizedEmail &&
      user.password === input.password &&
      user.role === input.role,
  );

  if (!match) return { ok: false as const, error: "Invalid email, password, or role." };

  const nextUsers = db.users.map((user) =>
    user.id === match.id ? { ...user, lastLoginAt: nowIso() } : user,
  );
  writeDb({ ...db, users: nextUsers });
  return { ok: true as const, user: { ...match, lastLoginAt: nowIso() } };
};

const resolveOrg = (role: UserRole, name: string): OrgProfile => {
  if (role !== "org_officer") return mockOrgs[0];
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OF";

  return {
    id: `org-${Date.now()}`,
    name: `${name} Org`,
    handle: `@${name.toLowerCase().replace(/\s+/g, "")}`,
    avatar: initials,
    verified: false,
    followerCount: 0,
  };
};

export const createEventRecord = (input: {
  title: string;
  description: string;
  image: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  capacity: number;
  tags: string[];
  creatorName: string;
  creatorRole: UserRole;
  creatorUserId?: string;
}) => {
  const db = getDatabase();
  const event: EventRecord = {
    id: `event-${Date.now()}`,
    title: input.title,
    description: input.description,
    image: input.image,
    category: input.category,
    org: resolveOrg(input.creatorRole, input.creatorName),
    date: input.date,
    time: input.time,
    location: input.location,
    attendees: 0,
    capacity: input.capacity || 100,
    friendsGoing: [],
    saved: false,
    likes: 0,
    tags: input.tags,
    createdAt: nowIso(),
    createdByUserId: input.creatorUserId,
    checkInPoints: 10,
  };

  writeDb({ ...db, events: [event, ...db.events] });
  return event;
};

export const listEventRecords = () => getDatabase().events;

const CHECK_IN_POINTS_BY_EVENT: Record<string, number> = {
  "1": 10,
  "2": 15,
  "3": 10,
  "4": 5,
  "5": 8,
};

/** Points configured for an event. New events default to 10. */
export const pointsForEvent = (event: { id: string; checkInPoints?: number }) =>
  event.checkInPoints ?? CHECK_IN_POINTS_BY_EVENT[event.id] ?? 10;

export const recordCheckIn = (input: { eventId: string; userId: string }) => {
  const db = getDatabase();
  const event = db.events.find((item) => item.id === input.eventId);
  if (!event) return { ok: false as const, reason: "Event not found." };

  const attendee = db.users.find((user) => user.id === input.userId);
  if (!attendee) return { ok: false as const, reason: "Student account not found." };

  const alreadyCheckedIn = db.attendance.some(
    (row) => row.eventId === event.id && row.attendeeId === attendee.id,
  );
  if (alreadyCheckedIn) {
    return { ok: false as const, reason: "This student is already checked in for this event." };
  }

  const record: AttendanceRecord = {
    id: `attendance-${Date.now()}`,
    eventId: event.id,
    eventTitle: event.title,
    orgId: event.org.id,
    orgName: event.org.name,
    attendeeId: attendee.id,
    attendeeName: attendee.name,
    attendeeEmail: attendee.email,
    checkedInAt: nowIso(),
    pointsAwarded: pointsForEvent(event),
  };

  writeDb({ ...db, attendance: [record, ...db.attendance] });
  return { ok: true as const, record };
};
