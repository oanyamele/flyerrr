import type { AppUser, EventRecord, UserRole } from "@/data/appDatabase";
import type { AttendanceRecord, AttendanceSummary } from "@/data/attendanceStore";
import type { CampusEvent, EventCategory, OrgProfile } from "@/data/mockEvents";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthenticateUserInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateEventInput {
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
}

export type UserResult = { ok: true; user: AppUser } | { ok: false; error: string };

export type CheckInValidation =
  | { ok: true; eventId: string; userId: string }
  | { ok: false; reason: string };

export interface UserRepository {
  createUser(input: CreateUserInput): Promise<UserResult>;
  authenticateUser(input: AuthenticateUserInput): Promise<UserResult>;
}

export interface EventRepository {
  listEvents(): EventRecord[];
  listCatalog(): CampusEvent[];
  listOrganizations(): OrgProfile[];
  createEvent(input: CreateEventInput): Promise<EventRecord>;
}

export interface AttendanceRepository {
  listAttendance(): AttendanceRecord[];
  summarizeAttendance(): AttendanceSummary[];
  exportAttendanceCsv(): string;
  isRsvped(eventId: string, userId: string): boolean;
  toggleRsvp(eventId: string, userId: string): Promise<boolean>;
  reminderMapForUser(userId: string): Record<string, boolean>;
  setReminderEnabled(eventId: string, userId: string, enabled: boolean): Promise<void>;
  reminderEvents(events: EventRecord[], userId: string): EventRecord[];
  issueCheckInToken(eventId: string, userId: string): Promise<{ token: string; expiresAt: number }>;
  validateCheckInToken(token: string): Promise<CheckInValidation>;
}

export interface AppRepositories {
  users: UserRepository;
  events: EventRepository;
  attendance: AttendanceRepository;
}

export const bundleRepositories = (
  repo: UserRepository & EventRepository & AttendanceRepository,
): AppRepositories => ({
  users: repo,
  events: repo,
  attendance: repo,
});
