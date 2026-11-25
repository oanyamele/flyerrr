import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/lib/storage";
import type { EventRecord } from "@/data/appDatabase";
import {
  getReminderEvents,
  getRsvpsForUser,
  isRsvped,
  issueDynamicCheckInToken,
  setReminderEnabled,
  toggleRsvp,
  validateCheckInToken,
} from "@/data/checkInStore";

const events = [
  { id: "1", title: "Welcome Week" },
  { id: "2", title: "Hackathon" },
] as EventRecord[];

describe("check-in tokens", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("issues a token and accepts it once", () => {
    const issued = issueDynamicCheckInToken("1", "user-student-1");
    const first = validateCheckInToken(issued.token);
    expect(first).toEqual({ ok: true, eventId: "1", userId: "user-student-1" });

    expect(validateCheckInToken(issued.token)).toEqual({
      ok: false,
      reason: "QR code already used.",
    });
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const issued = issueDynamicCheckInToken("1", "user-student-1");
    vi.setSystemTime(new Date("2026-01-01T00:00:21.000Z"));

    expect(validateCheckInToken(issued.token)).toEqual({
      ok: false,
      reason: "QR code expired. Ask student to refresh.",
    });
  });

  it("rejects a screenshot of an older token after a refresh", () => {
    const olderPayload = { eventId: "1", userId: "user-student-1", expiresAt: Date.now() + 5_000, nonce: "old" };
    const latestPayload = { eventId: "1", userId: "user-student-1", expiresAt: Date.now() + 15_000, nonce: "new" };
    const olderToken = btoa(JSON.stringify(olderPayload));
    const latestToken = btoa(JSON.stringify(latestPayload));
    localStorage.setItem(STORAGE_KEYS.checkInTokens, JSON.stringify([
      { token: olderToken, ...olderPayload, used: false },
      { token: latestToken, ...latestPayload, used: false },
    ]));

    expect(validateCheckInToken(olderToken)).toEqual({
      ok: false,
      reason: "QR code is outdated. Screenshot codes are rejected.",
    });
    expect(validateCheckInToken(latestToken).ok).toBe(true);
  });

  it("rejects a garbled code and a code this device never issued", () => {
    expect(validateCheckInToken("not-a-token")).toEqual({ ok: false, reason: "Invalid QR code." });

    const foreign = btoa(JSON.stringify({
      eventId: "1",
      userId: "user-student-1",
      expiresAt: Date.now() + 10_000,
      nonce: "elsewhere",
    }));
    expect(validateCheckInToken(foreign)).toEqual({ ok: false, reason: "QR code not recognized." });
  });

  it("still issues a token when the stored token list is unreadable", () => {
    localStorage.setItem(STORAGE_KEYS.checkInTokens, "{broken");
    const issued = issueDynamicCheckInToken("2", "user-student-1");
    expect(validateCheckInToken(issued.token).ok).toBe(true);
  });
});

describe("rsvps and reminders", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("turns a reminder on with the RSVP and off when the student leaves", () => {
    expect(getRsvpsForUser("user-student-1")).toEqual([]);
    expect(toggleRsvp("1", "user-student-1")).toBe(true);
    expect(isRsvped("1", "user-student-1")).toBe(true);
    expect(getReminderEvents(events, "user-student-1").map((event) => event.id)).toEqual(["1"]);

    setReminderEnabled("1", "user-student-1", false);
    expect(getReminderEvents(events, "user-student-1")).toEqual([]);

    expect(toggleRsvp("1", "user-student-1")).toBe(false);
    expect(isRsvped("1", "user-student-1")).toBe(false);
  });

  it("treats unreadable RSVP storage as an empty list", () => {
    localStorage.setItem(STORAGE_KEYS.rsvps, "{broken");
    localStorage.setItem(STORAGE_KEYS.reminders, "{broken");
    expect(isRsvped("1", "user-student-1")).toBe(false);
    setReminderEnabled("1", "user-student-1", true);
    expect(getReminderEvents(events, "user-student-1")).toEqual([]);
  });
});
