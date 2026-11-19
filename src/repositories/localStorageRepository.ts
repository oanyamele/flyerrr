import { authenticateUser, createEventRecord, createUser, getDatabase, listEventRecords } from "@/data/appDatabase";
import { buildAttendanceCsv, getAttendanceSummary } from "@/data/attendanceStore";
import {
  getReminderEvents,
  getReminderMapForUser,
  isRsvped,
  issueDynamicCheckInToken,
  setReminderEnabled,
  toggleRsvp,
  validateCheckInToken,
} from "@/data/checkInStore";
import { mockEvents, mockOrgs } from "@/data/mockEvents";
import type {
  AttendanceRepository,
  AuthenticateUserInput,
  CreateEventInput,
  CreateUserInput,
  EventRepository,
  UserRepository,
} from "@/repositories/contracts";

/** Offline and test adapter. Pages talk to this through the repository interfaces. */
export class LocalStorageRepository implements UserRepository, EventRepository, AttendanceRepository {
  createUser(input: CreateUserInput) {
    return Promise.resolve(createUser(input));
  }

  authenticateUser(input: AuthenticateUserInput) {
    return Promise.resolve(authenticateUser(input));
  }

  listEvents() {
    return listEventRecords();
  }

  listCatalog() {
    return mockEvents;
  }

  listOrganizations() {
    return mockOrgs;
  }

  createEvent(input: CreateEventInput) {
    return Promise.resolve(createEventRecord(input));
  }

  listAttendance() {
    return getDatabase().attendance;
  }

  summarizeAttendance() {
    return getAttendanceSummary(getDatabase().attendance);
  }

  exportAttendanceCsv() {
    return buildAttendanceCsv(getDatabase().attendance);
  }

  isRsvped(eventId: string, userId: string) {
    return isRsvped(eventId, userId);
  }

  toggleRsvp(eventId: string, userId: string) {
    return Promise.resolve(toggleRsvp(eventId, userId));
  }

  reminderMapForUser(userId: string) {
    return getReminderMapForUser(userId);
  }

  setReminderEnabled(eventId: string, userId: string, enabled: boolean) {
    setReminderEnabled(eventId, userId, enabled);
    return Promise.resolve();
  }

  reminderEvents(events: Parameters<AttendanceRepository["reminderEvents"]>[0], userId: string) {
    return getReminderEvents(events, userId);
  }

  issueCheckInToken(eventId: string, userId: string) {
    return Promise.resolve(issueDynamicCheckInToken(eventId, userId));
  }

  validateCheckInToken(token: string) {
    return Promise.resolve(validateCheckInToken(token));
  }
}
