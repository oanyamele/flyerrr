import { describe, expect, it } from "vitest";
import { mockEvents, type CampusEvent } from "@/data/mockEvents";
import { searchEvents } from "@/lib/searchEvents";

const createdEvent: CampusEvent = {
  ...mockEvents[0],
  id: "event-created-by-officer",
  title: "Robotics Club Demo Night",
  location: "Innovation Lab",
  tags: ["robots", "engineering"],
  org: {
    ...mockEvents[0].org,
    id: "org-robotics",
    name: "Howard Robotics Club",
  },
};

describe("searchEvents", () => {
  it("finds a runtime-created event instead of relying on the seed list", () => {
    expect(searchEvents([createdEvent], "robotics")).toEqual([createdEvent]);
  });

  it.each(["  DEMO night  ", "innovation", "ENGINEERING"])(
    "normalizes and searches title, location, and tags for %s",
    (query) => {
      expect(searchEvents([createdEvent], query)).toEqual([createdEvent]);
    },
  );

  it("returns no results for an empty or whitespace-only query", () => {
    expect(searchEvents([createdEvent], "   ")).toEqual([]);
  });

  it("handles malformed persisted tags defensively", () => {
    const malformedEvent = { ...createdEvent, tags: null } as unknown as CampusEvent;

    expect(searchEvents([malformedEvent], "robotics")).toEqual([malformedEvent]);
    expect(searchEvents([malformedEvent], "engineering")).toEqual([]);
  });
});
