import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBookmarks, setBookmark } from "./bookmarks";
import { getDatabase } from "./appDatabase";

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("offline bookmarks", () => {
  it("persists per user across reads, deduplicates saves, and removes them", async () => {
    const eventId = getDatabase().events[0].id;
    await setBookmark("alice", eventId, true);
    await setBookmark("alice", eventId, true);
    expect((await fetchBookmarks("alice")).map(e => e.id)).toEqual([eventId]);
    expect(await fetchBookmarks("bob")).toEqual([]);
    await setBookmark("bob", eventId, false);
    expect(await fetchBookmarks("alice")).toHaveLength(1);
    await setBookmark("alice", eventId, false);
    expect(await fetchBookmarks("alice")).toEqual([]);
  });

  it("rejects anonymous and missing-event writes without claiming success", async () => {
    await expect(setBookmark(undefined, "1", true)).rejects.toThrow("Sign in");
    await expect(setBookmark("alice", "missing-event", true)).rejects.toThrow("Event not found");
    expect(await fetchBookmarks(undefined)).toEqual([]);
  });

  it("preserves unreadable data and surfaces storage quota failures", async () => {
    localStorage.setItem("flyerrr_bookmarks_v1", "{invalid");
    await expect(fetchBookmarks("alice")).rejects.toThrow();
    expect(localStorage.getItem("flyerrr_bookmarks_v1")).toBe("{invalid");
    localStorage.removeItem("flyerrr_bookmarks_v1");
    const id = getDatabase().events[0].id;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    await expect(setBookmark("alice", id, true)).rejects.toThrow("Quota exceeded");
  });
});
