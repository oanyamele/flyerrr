import { ApiError, apiRequest } from "@/services/httpApi";

/**
 * Client for the server's check-in codes. A student asks for a code and shows it; an officer
 * on another device submits it. The server signs the code, expires it and lets it work once.
 * The browser never decides whether a code is valid, so nothing here can be forged by editing it.
 */
export interface CheckInCode {
  token: string;
  /** When the server says the code expires, in milliseconds since 1970. */
  expiresAt: number;
}

export interface Attendee {
  userId: string;
  name: string;
  email: string;
}

export interface ServerAttendanceRecord extends Attendee {
  checkedInAt: string;
  checkedInBy: string | null;
}

export type CheckInRejection = "invalid" | "wrong_event" | "expired" | "already_used" | "already_checked_in" | "rejected";

export type RedeemResult =
  | { ok: true; attendee: Attendee; checkedInAt: string }
  | { ok: false; reason: CheckInRejection; message: string; checkedInAt?: string };

const REJECTIONS: readonly string[] = ["invalid", "wrong_event", "expired", "already_used", "already_checked_in"];
const eventPath = (eventId: string) => `/events/${encodeURIComponent(eventId)}`;

/** Signed-in person: get a fresh code for themself. Asking again replaces the previous code. */
export const requestCheckInCode = async (eventId: string): Promise<CheckInCode> => {
  const issued = await apiRequest<{ token: string; expiresAt: string }>(`${eventPath(eventId)}/check-in-tokens`, { method: "POST" });
  return { token: issued.token, expiresAt: Date.parse(issued.expiresAt) };
};

/**
 * Officer: submit a code from a student's device. An expected refusal (bad, expired, used or
 * duplicate code) comes back as `{ ok: false }` with the server's reason, so the screen can say why.
 * Anything else, such as being signed out or the server being down, is thrown.
 */
export const redeemCheckInCode = async (eventId: string, token: string): Promise<RedeemResult> => {
  try {
    const done = await apiRequest<{ attendee: Attendee; checkedInAt: string }>(`${eventPath(eventId)}/check-ins`, {
      method: "POST", body: JSON.stringify({ token: token.trim() }),
    });
    return { ok: true, attendee: done.attendee, checkedInAt: done.checkedInAt };
  } catch (error) {
    if (!(error instanceof ApiError) || ![400, 409, 410].includes(error.status)) throw error;
    const { code, checkedInAt } = error.body;
    return {
      ok: false,
      reason: typeof code === "string" && REJECTIONS.includes(code) ? (code as CheckInRejection) : "rejected",
      message: error.message,
      ...(typeof checkedInAt === "string" ? { checkedInAt } : {}),
    };
  }
};

/** Officer: everyone checked in to the event so far. */
export const fetchEventAttendance = (eventId: string) =>
  apiRequest<ServerAttendanceRecord[]>(`${eventPath(eventId)}/attendance`);
