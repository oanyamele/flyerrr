import type { EventRecord } from "./appDatabase";
import { getDatabase } from "./appDatabase";
import { apiRequest, useHttpBackend } from "@/services/httpApi";
import { STORAGE_KEYS, readStringOrThrow, writeJson } from "@/lib/storage";

const KEY = STORAGE_KEYS.bookmarks;

const readBookmarks = (): Record<string, string[]> => {
  const value: unknown = JSON.parse(readStringOrThrow(KEY) ?? "{}");
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.values(value).some(ids => !Array.isArray(ids) || ids.some(id => typeof id !== "string"))) {
    throw new Error("Saved event data could not be read.");
  }
  return value as Record<string, string[]>;
};

export const fetchBookmarks = async (userId: string | undefined): Promise<EventRecord[]> => {
  if (!userId) return [];
  if (useHttpBackend) return apiRequest("/bookmarks");
  const ids = new Set(readBookmarks()[userId] ?? []);
  return getDatabase().events.filter(event => ids.has(event.id)).map(event => ({ ...event, saved: true }));
};

export const setBookmark = async (userId: string | undefined, eventId: string, saved: boolean): Promise<void> => {
  if (!userId) throw new Error("Sign in to save events.");
  if (useHttpBackend) return apiRequest(`/bookmarks/${encodeURIComponent(eventId)}`, { method: saved ? "PUT" : "DELETE" });
  if (!getDatabase().events.some(event => event.id === eventId)) throw new Error("Event not found.");
  const all = readBookmarks();
  const ids = new Set(all[userId] ?? []);
  if (saved) ids.add(eventId); else ids.delete(eventId);
  // A failed write remains an error. Never report an unpersisted save as success.
  writeJson(KEY, { ...all, [userId]: [...ids] });
};
