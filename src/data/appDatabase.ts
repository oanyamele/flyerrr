import { attendanceRecords, type AttendanceRecord } from "@/data/attendanceStore";
import { mockEvents, mockOrgs, type CampusEvent, type EventCategory, type OrgProfile } from "@/data/mockEvents";

export type UserRole = "student" | "org_officer";

export interface AppUser {
  id: string;
  email: string;
  /** PBKDF2-SHA256 hex digest. The plaintext password is never stored. */
  passwordHash: string;
  passwordSalt: string;
  /** Pre-F1.5 plaintext field. Upgraded to a hash at the next sign-in, then removed. */
  password?: string;
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

// Offline demo mode keeps accounts in this browser, so it hashes passwords
// with Web Crypto PBKDF2. The shared server mode uses argon2 instead (server/).
const PBKDF2_ITERATIONS = 100_000;
const SEED_PASSWORD_SALT = "flyerrr-seed-salt-v1";
const SEED_PASSWORD_HASH = "4c5f380b7f0a751b9c02f057967947aa85d7e1f60fb4735c25c251e4cff1bbaf";
const SEED_USER_IDS = new Set(["user-admin-1", "user-student-1"]);

const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");

export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
};

const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

/** Strips any stored plaintext password from a user record. */
const withoutPlaintext = ({ password: _plaintext, ...user }: AppUser): AppUser => user;

/** Seed accounts saved before F1.5 held plaintext passwords; reset them to the hashed seed. */
const migrateSeedPasswords = (db: AppDatabase) => {
  if (!db.users.some((user) => SEED_USER_IDS.has(user.id) && (user.password !== undefined || !user.passwordHash))) return db;
  return writeDb({
    ...db,
    users: db.users.map((user) =>
      SEED_USER_IDS.has(user.id)
        ? { ...withoutPlaintext(user), passwordHash: SEED_PASSWORD_HASH, passwordSalt: SEED_PASSWORD_SALT }
        : user,
    ),
  });
};

const toSeedEvent = (event: CampusEvent): EventRecord => ({
  ...event,
  createdAt: nowIso(),
});

const defaultDatabase = (): AppDatabase => ({
  users: [
    {
      id: "user-admin-1",
      email: "officer@howard.edu",
      passwordHash: SEED_PASSWORD_HASH,
      passwordSalt: SEED_PASSWORD_SALT,
      name: "Campus Officer",
      role: "org_officer",
      createdAt: nowIso(),
      lastLoginAt: nowIso(),
      metadata: { notificationsEnabled: true },
    },
    {
      id: "user-student-1",
      email: "student@howard.edu",
      passwordHash: SEED_PASSWORD_HASH,
      passwordSalt: SEED_PASSWORD_SALT,
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
  if (existing) return syncSeedEvents(migrateSeedPasswords(existing));
  const seed = defaultDatabase();
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
};

/** Offline sign-up. New accounts are always students, matching the server rule. */
export const createUser = async (input: { email: string; password: string; name: string }) => {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (getDatabase().users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { ok: false as const, error: "Account already exists for this email." };
  }

  const passwordSalt = newSalt();
  const user: AppUser = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    passwordHash: await hashPassword(input.password, passwordSalt),
    passwordSalt,
    name: input.name.trim(),
    role: "student",
    createdAt: nowIso(),
    lastLoginAt: nowIso(),
    metadata: { notificationsEnabled: true },
  };

  // Re-read after hashing so a write made meanwhile isn't lost.
  const db = getDatabase();
  writeDb({ ...db, users: [user, ...db.users] });
  return { ok: true as const, user };
};

/** Offline sign-in. The role comes from the stored account, never from the form. */
export const authenticateUser = async (input: { email: string; password: string }) => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const failure = { ok: false as const, error: "Invalid email or password." };
  const found = getDatabase().users.find((user) => user.email.toLowerCase() === normalizedEmail);
  if (!found) return failure;

  let upgraded: AppUser;
  if (found.password !== undefined) {
    // Legacy plaintext record: check it once, then replace it with a hash.
    if (found.password !== input.password) return failure;
    const passwordSalt = newSalt();
    upgraded = { ...withoutPlaintext(found), passwordSalt, passwordHash: await hashPassword(input.password, passwordSalt) };
  } else {
    if ((await hashPassword(input.password, found.passwordSalt)) !== found.passwordHash) return failure;
    upgraded = found;
  }

  const user = { ...upgraded, lastLoginAt: nowIso() };
  const db = getDatabase();
  writeDb({ ...db, users: db.users.map((existing) => (existing.id === user.id ? user : existing)) });
  return { ok: true as const, user };
};

/** True only when a stored offline session belongs to a real account with that same role. */
export const isKnownOfflineSession = (session: { isLoggedIn: boolean; userId?: string; role: UserRole }) => {
  if (!session.isLoggedIn) return true;
  const user = getDatabase().users.find((candidate) => candidate.id === session.userId);
  return !!user && user.role === session.role;
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
  };

  writeDb({ ...db, events: [event, ...db.events] });
  return event;
};

export const listEventRecords = () => getDatabase().events;
