import { createHmac, timingSafeEqual } from "node:crypto";

/** How long a check-in code stays valid, counted from the moment the server issues it. */
export const CHECK_IN_TTL_SECONDS = 120;
/** The signing secret must be at least this long. Generate one with `openssl rand -hex 32`. */
export const MIN_SECRET_LENGTH = 32;

// What a check-in code says. Only the server can produce a code with a valid signature, so a
// student cannot change the event, the person or the expiry without the server noticing.
export interface CheckInClaims {
  nonce: string;
  eventId: string;
  userId: string;
  /** Expiry as whole seconds since 1970, set from the database clock when the code is issued. */
  expiresAt: number;
}
export type CheckInRead = { ok: true; claims: CheckInClaims } | { ok: false; reason: "malformed" | "signature" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const MAX_TOKEN_LENGTH = 600;
const mac = (secret: string, body: string) => createHmac("sha256", secret).update(`flyerrr.check-in.v1.${body}`).digest();

/** A code looks like `<payload>.<signature>`, both base64url. The signature is HMAC-SHA256 over the payload. */
export const signCheckInToken = (secret: string, claims: CheckInClaims) => {
  if (secret.length < MIN_SECRET_LENGTH) throw new Error("The check-in secret is too short.");
  const body = Buffer.from(JSON.stringify({ v: 1, n: claims.nonce, e: claims.eventId, u: claims.userId, x: claims.expiresAt })).toString("base64url");
  return `${body}.${mac(secret, body).toString("base64url")}`;
};

/** Checks the signature first, in constant time, and only then looks inside the payload. */
export const readCheckInToken = (secret: string, token: unknown): CheckInRead => {
  if (typeof token !== "string" || token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 2 || !BASE64URL.test(parts[0]) || !BASE64URL.test(parts[1])) return { ok: false, reason: "malformed" };
  const [body, signature] = parts;
  const expected = mac(secret, body);
  const provided = Buffer.from(signature, "base64url");
  // The last character of a base64 signature carries spare bits that decoding ignores. Requiring
  // the canonical spelling means no character of the signature can be changed and still pass.
  if (provided.toString("base64url") !== signature || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: "signature" };
  }
  try {
    const payload: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload !== "object" || payload === null) return { ok: false, reason: "malformed" };
    const { v, n, e, u, x } = payload as Record<string, unknown>;
    if (v !== 1 || typeof n !== "string" || typeof e !== "string" || typeof u !== "string" || !UUID.test(n) || !UUID.test(e) || !UUID.test(u) || !Number.isSafeInteger(x)) {
      return { ok: false, reason: "malformed" };
    }
    return { ok: true, claims: { nonce: n, eventId: e, userId: u, expiresAt: x as number } };
  } catch {
    return { ok: false, reason: "malformed" };
  }
};
