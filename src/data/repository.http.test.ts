import { beforeEach, describe, expect, it } from "vitest";

const httpMocks = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
  return { apiRequest: vi.fn(), ApiError, useHttpBackend: true as const };
});

vi.mock("@/services/httpApi", () => httpMocks);

import { fetchEvent, fetchEvents, saveNewEvent } from "@/data/repository";

const { apiRequest: request, ApiError } = httpMocks;

const eventInput = {
  title: "Remote event",
  description: "Posted to the API",
  image: "/flyers/lab.png",
  category: "academic" as const,
  date: "Fri, Oct 3",
  time: "6:00 PM",
  location: "iLab",
  capacity: 20,
  tags: ["api"],
  creatorName: "Campus Officer",
  creatorRole: "org_officer" as const,
};

describe("http data repository", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("reads and creates events through the API", async () => {
    request.mockResolvedValueOnce([{ id: "api-1", title: "API Night" }]);
    expect(await fetchEvents()).toEqual([{ id: "api-1", title: "API Night" }]);
    expect(request).toHaveBeenCalledWith("/events");

    request.mockResolvedValueOnce({ id: "api-2", title: "Remote event" });
    const created = await saveNewEvent(eventInput);
    expect(created.id).toBe("api-2");
    expect(request).toHaveBeenLastCalledWith("/events", {
      method: "POST",
      body: JSON.stringify(eventInput),
    });
  });

  it("turns a missing event into null and rethrows other failures", async () => {
    request.mockRejectedValueOnce(new ApiError("missing", 404));
    expect(await fetchEvent("gone")).toBeNull();

    request.mockRejectedValueOnce(new ApiError("down", 500));
    await expect(fetchEvent("1")).rejects.toMatchObject({ status: 500 });

    request.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchEvent("1")).rejects.toThrow("offline");
  });
});
