import type { EventRecord } from "@/data/appDatabase";

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

const RSVP_KEY = "flyer_rsvp_v1";
const REMINDER_KEY = "flyer_reminders_v1";
const TOKEN_KEY = "flyer_checkin_tokens_v1";

export const QR_TOKEN_TTL_SECONDS = 20;

const safeRead = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getRsvpsForUser = (userId: string) => {
  const all = safeRead<RsvpEntry[]>(RSVP_KEY, []);
  return all.filter((entry) => entry.userId === userId);
};

export const isRsvped = (eventId: string, userId: string) =>
  getRsvpsForUser(userId).some((entry) => entry.eventId === eventId);

export const toggleRsvp = (eventId: string, userId: string) => {
  const all = safeRead<RsvpEntry[]>(RSVP_KEY, []);
  const exists = all.some((entry) => entry.eventId === eventId && entry.userId === userId);
  const next = exists
    ? all.filter((entry) => !(entry.eventId === eventId && entry.userId === userId))
    : [...all, { eventId, userId, createdAt: new Date().toISOString() }];

  safeWrite(RSVP_KEY, next);
  if (!exists) setReminderEnabled(eventId, userId, true);
  return !exists;
};

export const getReminderMapForUser = (userId: string) => {
  const all = safeRead<Record<string, ReminderSettings>>(REMINDER_KEY, {});
  return all[userId] ?? {};
};

export const setReminderEnabled = (eventId: string, userId: string, enabled: boolean) => {
  const all = safeRead<Record<string, ReminderSettings>>(REMINDER_KEY, {});
  const userSettings = all[userId] ?? {};
  const nextUserSettings = { ...userSettings, [eventId]: enabled };
  safeWrite(REMINDER_KEY, { ...all, [userId]: nextUserSettings });
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

  const all = safeRead<ActiveCheckInToken[]>(TOKEN_KEY, []);
  const filtered = all.filter((entry) => !(entry.eventId === eventId && entry.userId === userId));
  filtered.push({ token, eventId, userId, expiresAt, used: false });
  safeWrite(TOKEN_KEY, filtered);

  return { token, expiresAt };
};

export const validateCheckInToken = (token: string) => {
  const payload = decodePayload<{ eventId: string; userId: string; expiresAt: number; nonce: string }>(token);
  if (!payload) return { ok: false as const, reason: "Invalid QR code." };

  const all = safeRead<ActiveCheckInToken[]>(TOKEN_KEY, []);
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
  safeWrite(TOKEN_KEY, next);
  return { ok: true as const, eventId: payload.eventId, userId: payload.userId };
};

export const secondsRemaining = (expiresAt: number) => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
