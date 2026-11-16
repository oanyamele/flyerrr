import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_KEYS,
  STORAGE_KEYS,
  migrateLegacyKeys,
  readJson,
  readString,
  removeItem,
  writeJson,
  writeString,
} from "@/lib/storage";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses one prefix and a schema version on every key", () => {
    const keys = Object.values(STORAGE_KEYS);
    expect(keys).toHaveLength(7);
    for (const key of keys) expect(key).toMatch(/^flyerrr_[a-z_]+_v\d+$/);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("maps every current key to the name it used before issue #28", () => {
    expect(LEGACY_KEYS).toEqual({
      flyerrr_auth_v1: "flyerrr_auth",
      flyerrr_follows_v1: "flyerrr_follows",
      flyerrr_theme_v1: "flyerrr_theme",
      flyerrr_db_v1: "flyer_db_v1",
      flyerrr_rsvps_v1: "flyer_rsvp_v1",
      flyerrr_reminders_v1: "flyer_reminders_v1",
      flyerrr_checkin_tokens_v1: "flyer_checkin_tokens_v1",
    });
  });

  it("stores plain strings without JSON quotes", () => {
    writeString(STORAGE_KEYS.theme, "dark");
    expect(localStorage.getItem("flyerrr_theme_v1")).toBe("dark");
    expect(readString(STORAGE_KEYS.theme)).toBe("dark");
  });

  it("round-trips JSON values", () => {
    writeJson(STORAGE_KEYS.follows, ["org-1", "org-2"]);
    expect(localStorage.getItem("flyerrr_follows_v1")).toBe('["org-1","org-2"]');
    expect(readJson(STORAGE_KEYS.follows, [])).toEqual(["org-1", "org-2"]);
  });

  it("returns the fallback when nothing is saved", () => {
    expect(readJson(STORAGE_KEYS.follows, ["fallback"])).toEqual(["fallback"]);
    expect(readString(STORAGE_KEYS.theme)).toBeNull();
  });

  it("returns the fallback for corrupt JSON instead of throwing", () => {
    localStorage.setItem("flyerrr_follows_v1", "{not-json");
    expect(readJson(STORAGE_KEYS.follows, [])).toEqual([]);
  });

  it("returns the fallback when the validator rejects the value", () => {
    localStorage.setItem("flyerrr_follows_v1", '{"not":"an array"}');
    expect(readJson(STORAGE_KEYS.follows, [], isStringArray)).toEqual([]);
  });

  it("removes a saved value", () => {
    writeString(STORAGE_KEYS.theme, "dark");
    removeItem(STORAGE_KEYS.theme);
    expect(readString(STORAGE_KEYS.theme)).toBeNull();
  });
});

describe("migrateLegacyKeys", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("moves every value saved under an old name to its new name", () => {
    for (const [, legacyKey] of Object.entries(LEGACY_KEYS)) {
      localStorage.setItem(legacyKey, `value-of-${legacyKey}`);
    }

    migrateLegacyKeys();

    for (const [currentKey, legacyKey] of Object.entries(LEGACY_KEYS)) {
      expect(localStorage.getItem(currentKey)).toBe(`value-of-${legacyKey}`);
      expect(localStorage.getItem(legacyKey)).toBeNull();
    }
  });

  it("keeps a signed-in user signed in", () => {
    const session = '{"isLoggedIn":true,"role":"student","userName":"Campus Student"}';
    localStorage.setItem("flyerrr_auth", session);

    migrateLegacyKeys();

    expect(readString(STORAGE_KEYS.auth)).toBe(session);
  });

  it("does not overwrite a newer value already saved under the new name", () => {
    localStorage.setItem("flyerrr_theme", "light");
    localStorage.setItem("flyerrr_theme_v1", "dark");

    migrateLegacyKeys();

    expect(localStorage.getItem("flyerrr_theme_v1")).toBe("dark");
    expect(localStorage.getItem("flyerrr_theme")).toBeNull();
  });

  it("is safe to run more than once", () => {
    localStorage.setItem("flyer_rsvp_v1", '[{"eventId":"1"}]');

    migrateLegacyKeys();
    migrateLegacyKeys();

    expect(readJson(STORAGE_KEYS.rsvps, [])).toEqual([{ eventId: "1" }]);
    expect(localStorage.length).toBe(1);
  });

  it("does nothing for a brand-new user", () => {
    migrateLegacyKeys();
    expect(localStorage.length).toBe(0);
  });

  it("keeps the old data when the new value can't be written", () => {
    localStorage.setItem("flyer_db_v1", '{"users":[]}');
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() => migrateLegacyKeys()).not.toThrow();
    setItem.mockRestore();

    expect(localStorage.getItem("flyer_db_v1")).toBe('{"users":[]}');
    expect(localStorage.getItem("flyerrr_db_v1")).toBeNull();
  });
});
