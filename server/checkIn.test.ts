import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readCheckInToken, signCheckInToken, type CheckInClaims } from "./checkIn";

const secret = "unit-test-secret-that-is-long-enough-123";
const claims = (): CheckInClaims => ({ nonce: randomUUID(), eventId: randomUUID(), userId: randomUUID(), expiresAt: 2_000_000_000 });
const decode = (token: string) => JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8")) as Record<string, unknown>;
const encode = (payload: object) => Buffer.from(JSON.stringify(payload)).toString("base64url");

describe("check-in tokens", () => {
  it("round-trips the signed claims", () => {
    const original = claims();
    assert.deepEqual(readCheckInToken(secret, signCheckInToken(secret, original)), { ok: true, claims: original });
  });

  it("rejects a payload that was edited after signing", () => {
    const token = signCheckInToken(secret, claims());
    for (const change of [{ e: randomUUID() }, { u: randomUUID() }, { x: 4_000_000_000 }, { n: randomUUID() }]) {
      const forged = `${encode({ ...decode(token), ...change })}.${token.split(".")[1]}`;
      assert.deepEqual(readCheckInToken(secret, forged), { ok: false, reason: "signature" }, JSON.stringify(change));
    }
  });

  it("rejects a changed signature and a token signed with another secret", () => {
    const token = signCheckInToken(secret, claims());
    const [body, signature] = token.split(".");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    for (const letter of alphabet) {
      if (letter === signature.at(-1)) continue;
      assert.equal(readCheckInToken(secret, `${body}.${signature.slice(0, -1)}${letter}`).ok, false, `last character ${letter}`);
    }
    assert.equal(readCheckInToken(secret, `${body}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`).ok, false);
    assert.deepEqual(readCheckInToken(secret, signCheckInToken("another-secret-that-is-also-long-enough-1", claims())), { ok: false, reason: "signature" });
    assert.deepEqual(readCheckInToken(secret, `${body}.`), { ok: false, reason: "malformed" });
  });

  it("rejects malformed input without throwing", () => {
    for (const bad of [undefined, null, 5, {}, "", "abc", "a.b.c", "!!.!!", `${"a".repeat(700)}.b`]) {
      assert.equal(readCheckInToken(secret, bad).ok, false, String(bad));
    }
  });

  it("rejects a correctly signed payload that has the wrong shape", () => {
    const sign = (payload: object) => {
      // Sign an odd body with the real secret, so only its shape is wrong.
      const body = encode(payload);
      return `${body}.${createHmac("sha256", secret).update(`flyerrr.check-in.v1.${body}`).digest().toString("base64url")}`;
    };
    const good = { v: 1, n: randomUUID(), e: randomUUID(), u: randomUUID(), x: 2_000_000_000 };
    assert.equal(readCheckInToken(secret, sign(good)).ok, true);
    for (const odd of [{ ...good, v: 2 }, { ...good, n: "not-a-uuid" }, { ...good, x: "soon" }, { ...good, x: 1.5 }, { v: 1 }, []]) {
      assert.deepEqual(readCheckInToken(secret, sign(odd)), { ok: false, reason: "malformed" }, JSON.stringify(odd));
    }
  });

  it("refuses to sign with a short secret", () => {
    assert.throws(() => signCheckInToken("short", claims()), /too short/);
  });
});
