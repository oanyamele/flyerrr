import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchEventAttendance, redeemCheckInCode, requestCheckInCode } from "@/services/checkInApi";
import { ApiError } from "@/services/httpApi";

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("requestCheckInCode", () => {
  it("asks the server for a code and returns its expiry as a timestamp", async () => {
    fetchMock.mockResolvedValue(reply({ token: "payload.signature", expiresAt: "2030-01-01T00:02:00.000Z" }, 201));
    const code = await requestCheckInCode("event/1 a");
    expect(code).toEqual({ token: "payload.signature", expiresAt: Date.parse("2030-01-01T00:02:00.000Z") });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/events/event%2F1%20a/check-in-tokens");
    expect(init).toMatchObject({ method: "POST", credentials: "same-origin" });
  });

  it("throws the server's message when it refuses", async () => {
    fetchMock.mockResolvedValue(reply({ error: "Event not found." }, 404));
    await expect(requestCheckInCode("gone")).rejects.toMatchObject({ message: "Event not found.", status: 404 });
  });
});

describe("redeemCheckInCode", () => {
  it("sends the trimmed code and returns who was checked in", async () => {
    const attendee = { userId: "u1", name: "Maya", email: "maya@bison.howard.edu" };
    fetchMock.mockResolvedValue(reply({ attendee, checkedInAt: "2030-01-01T00:01:00.000Z" }, 201));
    await expect(redeemCheckInCode("e1", "  abc.def \n")).resolves.toEqual({ ok: true, attendee, checkedInAt: "2030-01-01T00:01:00.000Z" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/events/e1/check-ins");
    expect(JSON.parse(init.body)).toEqual({ token: "abc.def" });
  });

  it.each([
    [400, "invalid", "This is not a valid check-in code."],
    [400, "wrong_event", "This code is for a different event."],
    [410, "expired", "This code has expired. Ask the student to refresh it."],
    [409, "already_used", "This code was already used."],
    [409, "already_checked_in", "This person is already checked in."],
  ])("reports a %i %s refusal with the server's reason", async (status, code, error) => {
    fetchMock.mockResolvedValue(reply({ error, code, checkedInAt: "2030-01-01T00:01:00.000Z" }, status));
    const result = await redeemCheckInCode("e1", "x");
    expect(result).toMatchObject({ ok: false, reason: code, message: error });
  });

  it("includes when the person was already checked in, and omits it when the server does not say", async () => {
    fetchMock.mockResolvedValueOnce(reply({ error: "used", code: "already_used", checkedInAt: "2030-01-01T00:01:00.000Z" }, 409));
    expect(await redeemCheckInCode("e1", "x")).toMatchObject({ checkedInAt: "2030-01-01T00:01:00.000Z" });
    fetchMock.mockResolvedValueOnce(reply({ error: "used", code: "already_used" }, 409));
    expect(await redeemCheckInCode("e1", "x")).not.toHaveProperty("checkedInAt");
  });

  it("treats an unrecognised refusal as a plain rejection", async () => {
    fetchMock.mockResolvedValue(reply({ error: "Something else.", code: "made_up" }, 400));
    expect(await redeemCheckInCode("e1", "x")).toEqual({ ok: false, reason: "rejected", message: "Something else." });
  });

  it("throws, rather than reporting a refusal, when signed out, not allowed or the server fails", async () => {
    for (const status of [401, 403, 404, 500]) {
      fetchMock.mockResolvedValueOnce(reply({ error: "nope" }, status));
      await expect(redeemCheckInCode("e1", "x")).rejects.toBeInstanceOf(ApiError);
    }
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(redeemCheckInCode("e1", "x")).rejects.toThrow("Failed to fetch");
  });
});

describe("fetchEventAttendance", () => {
  it("lists who has checked in", async () => {
    const rows = [{ userId: "u1", name: "Maya", email: "maya@bison.howard.edu", checkedInAt: "2030-01-01T00:01:00.000Z", checkedInBy: "o1" }];
    fetchMock.mockResolvedValue(reply(rows));
    await expect(fetchEventAttendance("e1")).resolves.toEqual(rows);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/events/e1/attendance");
  });
});

describe("ApiError", () => {
  it("keeps the server's response body so callers can read its fields", async () => {
    fetchMock.mockResolvedValue(reply({ error: "Too many.", code: "x" }, 429));
    const error = await requestCheckInCode("e1").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).body).toEqual({ error: "Too many.", code: "x" });
  });
});
