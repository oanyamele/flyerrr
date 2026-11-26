import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { computeUserStats, fetchUserStats } from "@/data/repository";
import { useAsyncData } from "@/hooks/useAsyncData";

describe("computeUserStats", () => {
  it("returns zeros for a brand-new account with no attendance records", () => {
    const stats = computeUserStats([], []);
    expect(stats).toEqual({
      eventsAttended: 0,
      points: 0,
      categoriesAttended: 0,
      distinctWeeks: 0,
    });
  });
});

describe("fetchUserStats", () => {
  it("returns zeros for an unknown user id instead of inventing values", async () => {
    const stats = await fetchUserStats("no-such-user");
    expect(stats).toEqual({
      eventsAttended: 0,
      points: 0,
      categoriesAttended: 0,
      distinctWeeks: 0,
    });
  });

  it("returns zeros when there is no signed-in user", async () => {
    const stats = await fetchUserStats(null);
    expect(stats.eventsAttended).toBe(0);
    expect(stats.points).toBe(0);
  });
});

describe("useAsyncData retry", () => {
  it("surfaces an error, then succeeds after a real retry", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return "recovered";
    };

    const { result } = renderHook(() => useAsyncData(fetcher));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.data).toBeUndefined();

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toBe("recovered");
    expect(calls).toBe(2);
  });

  it("exposes data without loading again when the fetcher succeeds", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return { count: 7 };
    };

    const { result } = renderHook(() => useAsyncData(fetcher));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual({ count: 7 });
    expect(calls).toBe(1);
  });
});
