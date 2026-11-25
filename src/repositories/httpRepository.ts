import { buildAttendanceCsv, getAttendanceSummary } from "@/data/attendanceStore";
import type { EventRecord } from "@/data/appDatabase";
import type { AttendanceRecord } from "@/data/attendanceStore";
import type { OrgProfile } from "@/data/mockEvents";
import type {
  AttendanceRepository,
  AuthenticateUserInput,
  CheckInValidation,
  CreateEventInput,
  CreateUserInput,
  EventRepository,
  UserRepository,
  UserResult,
} from "@/repositories/contracts";

interface RsvpEntry {
  eventId: string;
  userId: string;
}

interface HttpCache {
  events: EventRecord[];
  organizations: OrgProfile[];
  attendance: AttendanceRecord[];
  rsvps: RsvpEntry[];
  reminders: Record<string, Record<string, boolean>>;
}

const emptyCache = (): HttpCache => ({
  events: [],
  organizations: [],
  attendance: [],
  rsvps: [],
  reminders: {},
});

/**
 * API adapter. Reads come from the cache filled by `load()`.
 * Writes go to the server, then update that cache.
 *
 * Expected routes under the base URL:
 * GET /events, /organizations, /attendance, /rsvps, /reminders
 * POST /users, /sessions, /events, /rsvps/toggle, /reminders, /check-in/tokens, /check-in/validate
 */
export class HttpRepository implements UserRepository, EventRepository, AttendanceRepository {
  private cache: HttpCache = emptyCache();

  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async load(): Promise<void> {
    const [events, organizations, attendance, rsvps, reminders] = await Promise.all([
      this.get<EventRecord[]>("/events"),
      this.get<OrgProfile[]>("/organizations"),
      this.get<AttendanceRecord[]>("/attendance"),
      this.get<RsvpEntry[]>("/rsvps"),
      this.get<HttpCache["reminders"]>("/reminders"),
    ]);
    this.cache = { events, organizations, attendance, rsvps, reminders };
  }

  listEvents() {
    return this.cache.events;
  }

  listCatalog() {
    return this.cache.events;
  }

  listOrganizations() {
    return this.cache.organizations;
  }

  listAttendance() {
    return this.cache.attendance;
  }

  summarizeAttendance() {
    return getAttendanceSummary(this.cache.attendance);
  }

  exportAttendanceCsv() {
    return buildAttendanceCsv(this.cache.attendance);
  }

  isRsvped(eventId: string, userId: string) {
    return this.cache.rsvps.some((entry) => entry.eventId === eventId && entry.userId === userId);
  }

  reminderMapForUser(userId: string) {
    return this.cache.reminders[userId] ?? {};
  }

  reminderEvents(events: EventRecord[], userId: string) {
    const rsvpIds = new Set(
      this.cache.rsvps.filter((entry) => entry.userId === userId).map((entry) => entry.eventId),
    );
    const reminderMap = this.reminderMapForUser(userId);
    return events.filter((event) => rsvpIds.has(event.id) && reminderMap[event.id] !== false);
  }

  async createUser(input: CreateUserInput): Promise<UserResult> {
    return this.sendResult("/users", input, "Could not create account.");
  }

  async authenticateUser(input: AuthenticateUserInput): Promise<UserResult> {
    return this.sendResult("/sessions", input, "Could not sign in.");
  }

  async createEvent(input: CreateEventInput): Promise<EventRecord> {
    const event = await this.send<EventRecord>("/events", input);
    this.cache.events = [event, ...this.cache.events];
    return event;
  }

  async toggleRsvp(eventId: string, userId: string): Promise<boolean> {
    const result = await this.send<{ rsvped: boolean }>("/rsvps/toggle", { eventId, userId });
    const without = this.cache.rsvps.filter((entry) => !(entry.eventId === eventId && entry.userId === userId));
    this.cache.rsvps = result.rsvped ? [...without, { eventId, userId }] : without;
    if (result.rsvped) {
      this.cache.reminders = {
        ...this.cache.reminders,
        [userId]: { ...(this.cache.reminders[userId] ?? {}), [eventId]: true },
      };
    }
    return result.rsvped;
  }

  async setReminderEnabled(eventId: string, userId: string, enabled: boolean): Promise<void> {
    await this.send("/reminders", { eventId, userId, enabled });
    this.cache.reminders = {
      ...this.cache.reminders,
      [userId]: { ...(this.cache.reminders[userId] ?? {}), [eventId]: enabled },
    };
  }

  issueCheckInToken(eventId: string, userId: string) {
    return this.send<{ token: string; expiresAt: number }>("/check-in/tokens", { eventId, userId });
  }

  validateCheckInToken(token: string) {
    return this.send<CheckInValidation>("/check-in/validate", { token });
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`);
    if (!response.ok) throw new Error(`GET ${path} failed (${response.status})`);
    return (await response.json()) as T;
  }

  private async sendResult(path: string, body: unknown, fallbackError: string): Promise<UserResult> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as UserResult | null;
    if (payload && typeof payload === "object" && "ok" in payload) return payload;
    return { ok: false, error: fallbackError };
  }

  private async send<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`POST ${path} failed (${response.status})`);
    return (await response.json()) as T;
  }
}
