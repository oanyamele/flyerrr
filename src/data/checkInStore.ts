import type { EventRecord } from "@/data/appDatabase";
import { STORAGE_KEYS, readJson, writeJson } from "@/lib/storage";
export { secondsRemaining } from "@/lib/secondsRemaining";

interface RsvpEntry {
  eventId: string;
  userId: string;
  createdAt: string;
}

interface ReminderSettings {
  [eventId: string]: boolean;
}

interface ActiveCheckInToken {
  token: string;
  eventId: string;
  userId: string;
  expiresAt: number;
  used: boolean;
}

export const QR_TOKEN_TTL_SECONDS = 20;

export const getRsvpsForUser = (userId: string) => {
  const all = readJson<RsvpEntry[]>(STORAGE_KEYS.rsvps, []);
  return all.filter((entry) => entry.userId === userId);
};

export const isRsvped = (eventId: string, userId: string) =>
  getRsvpsForUser(userId).some((entry) => entry.eventId === eventId);

export const toggleRsvp = (eventId: string, userId: string) => {
  const all = readJson<RsvpEntry[]>(STORAGE_KEYS.rsvps, []);
  const exists = all.some((entry) => entry.eventId === eventId && entry.userId === userId);
  const next = exists
    ? all.filter((entry) => !(entry.eventId === eventId && entry.userId === userId))
    : [...all, { eventId, userId, createdAt: new Date().toISOString() }];

  writeJson(STORAGE_KEYS.rsvps, next);
  if (!exists) setReminderEnabled(eventId, userId, true);
  return !exists;
};

export const getReminderMapForUser = (userId: string) => {
  const all = readJson<Record<string, ReminderSettings>>(STORAGE_KEYS.reminders, {});
  return all[userId] ?? {};
};

export const setReminderEnabled = (eventId: string, userId: string, enabled: boolean) => {
  const all = readJson<Record<string, ReminderSettings>>(STORAGE_KEYS.reminders, {});
  const userSettings = all[userId] ?? {};
  const nextUserSettings = { ...userSettings, [eventId]: enabled };
  writeJson(STORAGE_KEYS.reminders, { ...all, [userId]: nextUserSettings });
};

export const getReminderEvents = (events: EventRecord[], userId: string) => {
  const rsvpIds = new Set(getRsvpsForUser(userId).map((entry) => entry.eventId));
  const reminderMap = getReminderMapForUser(userId);
  return events.filter((event) => rsvpIds.has(event.id) && reminderMap[event.id] !== false);
};

const encodePayload = (payload: object) => btoa(JSON.stringify(payload));
const decodePayload = <T,>(token: string): T | null => {
  try {
    return JSON.parse(atob(token)) as T;
  } catch {
    return null;
  }
};

export const issueDynamicCheckInToken = (eventId: string, userId: string) => {
  const now = Date.now();
  const expiresAt = now + QR_TOKEN_TTL_SECONDS * 1000;
  const nonce = `${now}-${Math.random().toString(36).slice(2, 10)}`;
  const payload = { eventId, userId, expiresAt, nonce };
  const token = encodePayload(payload);

  const all = readJson<ActiveCheckInToken[]>(STORAGE_KEYS.checkInTokens, []);
  const filtered = all.filter((entry) => !(entry.eventId === eventId && entry.userId === userId));
  filtered.push({ token, eventId, userId, expiresAt, used: false });
  writeJson(STORAGE_KEYS.checkInTokens, filtered);

  return { token, expiresAt };
};

export const validateCheckInToken = (token: string) => {
  const payload = decodePayload<{ eventId: string; userId: string; expiresAt: number; nonce: string }>(token);
  if (!payload) return { ok: false as const, reason: "Invalid QR code." };

  const all = readJson<ActiveCheckInToken[]>(STORAGE_KEYS.checkInTokens, []);
  const matching = all.find((entry) => entry.token === token);
  if (!matching) return { ok: false as const, reason: "QR code not recognized." };
  if (matching.used) return { ok: false as const, reason: "QR code already used." };
  if (Date.now() > payload.expiresAt) return { ok: false as const, reason: "QR code expired. Ask student to refresh." };

  const latestForUserEvent = all
    .filter((entry) => entry.eventId === payload.eventId && entry.userId === payload.userId)
    .sort((a, b) => b.expiresAt - a.expiresAt)[0];

  if (!latestForUserEvent || latestForUserEvent.token !== token) {
    return { ok: false as const, reason: "QR code is outdated. Screenshot codes are rejected." };
  }

  const next = all.map((entry) => (entry.token === token ? { ...entry, used: true } : entry));
  writeJson(STORAGE_KEYS.checkInTokens, next);
  return { ok: true as const, eventId: payload.eventId, userId: payload.userId };
};
