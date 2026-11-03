import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEYS,
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

  it("keeps the key names already saved in users' browsers", () => {
    expect(STORAGE_KEYS).toEqual({
      auth: "flyerrr_auth",
      follows: "flyerrr_follows",
      theme: "flyerrr_theme",
      database: "flyer_db_v1",
      rsvps: "flyer_rsvp_v1",
      reminders: "flyer_reminders_v1",
      checkInTokens: "flyer_checkin_tokens_v1",
    });
  });

  it("reads data written before this module existed", () => {
    localStorage.setItem("flyerrr_follows", '["org-1"]');
    expect(readJson(STORAGE_KEYS.follows, [])).toEqual(["org-1"]);
  });

  it("stores plain strings without JSON quotes", () => {
    writeString(STORAGE_KEYS.theme, "dark");
    expect(localStorage.getItem("flyerrr_theme")).toBe("dark");
    expect(readString(STORAGE_KEYS.theme)).toBe("dark");
  });

  it("round-trips JSON values", () => {
    writeJson(STORAGE_KEYS.follows, ["org-1", "org-2"]);
    expect(localStorage.getItem("flyerrr_follows")).toBe('["org-1","org-2"]');
    expect(readJson(STORAGE_KEYS.follows, [])).toEqual(["org-1", "org-2"]);
  });

  it("returns the fallback when nothing is saved", () => {
    expect(readJson(STORAGE_KEYS.follows, ["fallback"])).toEqual(["fallback"]);
    expect(readString(STORAGE_KEYS.theme)).toBeNull();
  });

  it("returns the fallback for corrupt JSON instead of throwing", () => {
    localStorage.setItem("flyerrr_follows", "{not-json");
    expect(readJson(STORAGE_KEYS.follows, [])).toEqual([]);
  });

  it("returns the fallback when the validator rejects the value", () => {
    localStorage.setItem("flyerrr_follows", '{"not":"an array"}');
    expect(readJson(STORAGE_KEYS.follows, [], isStringArray)).toEqual([]);
  });

  it("removes a saved value", () => {
    writeString(STORAGE_KEYS.theme, "dark");
    removeItem(STORAGE_KEYS.theme);
    expect(readString(STORAGE_KEYS.theme)).toBeNull();
  });
});
