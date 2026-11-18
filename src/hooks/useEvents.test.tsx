import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useCreateEvent, useEvents } from "./useEvents";

const eventInput = {
  title: "Officer-published career workshop",
  description: "An event published during the test.",
  image: "/placeholder.svg",
  category: "career",
  date: "2030-06-01",
  time: "12:00",
  location: "Campus",
  capacity: 20,
  tags: ["careers"],
  creatorName: "Campus Officer",
  creatorRole: "org_officer",
} satisfies Parameters<ReturnType<typeof useCreateEvent>["mutateAsync"]>[0];

let client: QueryClient;

const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  localStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  cleanup();
  client.clear();
});

describe("event queries", () => {
  it("refreshes the feed after an officer publishes an event", async () => {
    const { result } = renderHook(() => ({ feed: useEvents(), publish: useCreateEvent() }), { wrapper });
    await waitFor(() => expect(result.current.feed.isSuccess).toBe(true));
    expect(result.current.feed.data?.some((event) => event.title === eventInput.title)).toBe(false);

    await act(async () => {
      await result.current.publish.mutateAsync(eventInput);
    });

    await waitFor(() => expect(result.current.feed.data?.[0]?.title).toBe(eventInput.title));
  });

  it("surfaces an unreadable repository as an error without overwriting it", async () => {
    localStorage.setItem("flyer_db_v1", "{invalid");
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(localStorage.getItem("flyer_db_v1")).toBe("{invalid");
  });
});
