import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { Pool } from "pg";
import { z } from "zod";
import { createApi } from "./app";
import { migrate } from "./database";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required. Use a local test database.");
const schema = `bookmarks_test_${randomUUID().replaceAll("-", "")}`;
const admin = new Pool({ connectionString: databaseUrl });
const pool = new Pool({ connectionString: databaseUrl, options: `-c search_path=${schema}` });
const origin = "http://localhost:8080";
let server: Server;
let base: string;
const sessionSchema = z.object({ userId: z.string(), role: z.string(), isLoggedIn: z.boolean() });
const eventSchema = z.object({ id: z.string(), title: z.string(), saved: z.boolean() });
const eventsFrom = async (response: Response) => z.array(eventSchema).parse(await response.json());

const start = async () => {
  const app = await createApi(pool, { origin, secureCookies: false });
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No server address");
  base = `http://127.0.0.1:${address.port}`;
};
const stop = async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
};
const request = (path: string, cookie = "", method = "GET", body?: unknown, requestOrigin = origin) => fetch(`${base}/api${path}`, {
  method, headers: { "Content-Type": "application/json", Origin: requestOrigin, Cookie: cookie },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const register = async (email: string) => {
  const res = await request("/auth/register", "", "POST", { email, name: "Test Student", password: "GoodPassword123", role: "org_officer" });
  assert.equal(res.status, 200);
  const user = sessionSchema.parse(await res.json());
  const cookie = res.headers.get("set-cookie")!;
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(user.role, "student");
  assert.equal("password" in user, false);
  return { cookie: cookie.split(";")[0], user };
};
const eventBody = () => {
  const date = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  return { title: "Officer-created search target", description: "A real event persisted in PostgreSQL.", category: "career", date, time: "12:00", startsAt: `${date}T12:00:00Z`, timezone: "UTC", location: "Campus Center", capacity: 20, tags: ["unique-search"], image: "/placeholder.svg" };
};

describe("PostgreSQL bookmark API", () => {
  before(async () => {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await migrate(pool);
    await migrate(pool); // Applying the migration twice must preserve existing tables.
    await start();
  });
  after(async () => {
    if (server) await stop();
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });

  it("validates shared auth fields and rejects cross-origin credential writes", async () => {
    assert.equal((await request("/auth/register", "", "POST", { name: "Test", email: "test@gmail.com", password: "weak" })).status, 400);
    assert.equal((await request("/auth/login", "", "POST", { email: "test@howard.edu", password: "weak" }, "https://other.example")).status, 403);
    assert.equal((await request("/bookmarks")).status, 401);
    assert.equal((await request("/events", 'flyerrr_auth={"isLoggedIn":true,"role":"org_officer"}')).status, 401);
  });

  it("publishes to shared data, persists saves across restart, and isolates accounts", async () => {
    const alice = await register("alice@howard.edu");
    const bob = await register("bob@howard.edu");
    const officer = await register("officer@howard.edu");
    assert.equal((await request("/events", alice.cookie, "POST", { ...eventBody(), creatorRole: "org_officer", creatorUserId: officer.user.userId })).status, 403);
    await pool.query("UPDATE api_users SET role='org_officer' WHERE id=$1", [officer.user.userId]);
    assert.equal((await request("/events", officer.cookie, "POST", { ...eventBody(), capacity: 0 })).status, 400);
    assert.equal((await request("/events", officer.cookie, "POST", { ...eventBody(), startsAt: "2020-01-01T00:00:00Z" })).status, 400);
    const created = await request("/events", officer.cookie, "POST", eventBody());
    assert.equal(created.status, 201);
    const event = eventSchema.parse(await created.json());
    const feed = await eventsFrom(await request("/events", alice.cookie));
    assert.equal(feed[0].title, "Officer-created search target");
    assert.equal(feed[0].saved, false);
    const path = `/bookmarks/${event.id}`;
    assert.equal((await request(path, alice.cookie, "PUT")).status, 204);
    assert.equal((await request(path, alice.cookie, "PUT")).status, 204);
    assert.equal((await pool.query("SELECT count(*) FROM api_event_saves WHERE user_id=$1", [alice.user.userId])).rows[0].count, "1");
    assert.equal((await eventsFrom(await request("/bookmarks", alice.cookie)))[0].id, event.id);
    assert.deepEqual(await (await request("/bookmarks", bob.cookie)).json(), []);
    assert.equal(eventSchema.parse(await (await request(`/events/${event.id}`, bob.cookie)).json()).saved, false);
    // Supplying another user's identifier cannot delete that user's bookmark.
    assert.equal((await request(path, bob.cookie, "DELETE", { userId: alice.user.userId })).status, 204);
    assert.equal((await eventsFrom(await request("/bookmarks", alice.cookie))).length, 1);
    await stop();
    await start();
    assert.equal((await eventsFrom(await request("/bookmarks", alice.cookie)))[0].id, event.id);
    assert.equal((await request(path, alice.cookie, "DELETE")).status, 204);
    assert.equal((await request(path, alice.cookie, "DELETE")).status, 204);
    assert.deepEqual(await (await request("/bookmarks", alice.cookie)).json(), []);
    assert.equal((await request("/bookmarks/invalid", alice.cookie, "PUT")).status, 400);
    assert.equal((await request(`/bookmarks/${randomUUID()}`, alice.cookie, "PUT")).status, 404);
    const stored = (await pool.query("SELECT password_hash FROM api_users WHERE id=$1", [alice.user.userId])).rows[0].password_hash;
    assert.match(stored, /^\$argon2id\$/);
    assert.equal((await request("/auth/logout", alice.cookie, "POST")).status, 204);
    assert.equal((await request("/bookmarks", alice.cookie)).status, 401);
    const login = await request("/auth/login", "", "POST", { email: "ALICE@HOWARD.EDU", password: "GoodPassword123" });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    await pool.query("UPDATE api_sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1", [alice.user.userId]);
    assert.equal((await request("/bookmarks", cookie)).status, 401);
  });

  it("lets the creator edit, delete, and invite other accounts to edit an event", async () => {
    const owner = await register("owner@howard.edu");
    const editor = await register("editor@howard.edu");
    const other = await register("other-officer@howard.edu");
    const student = await register("plain-student@howard.edu");
    await pool.query("UPDATE api_users SET role='org_officer' WHERE id = ANY($1::uuid[])", [[owner.user.userId, editor.user.userId, other.user.userId]]);
    const created = eventSchema.parse(await (await request("/events", owner.cookie, "POST", eventBody())).json());
    const path = `/events/${created.id}`;
    const edited = { ...eventBody(), title: "Edited by the creator" };

    // Students and uninvited officers cannot edit; bad input and unknown events are rejected.
    assert.equal((await request(path, student.cookie, "PUT", edited)).status, 403);
    assert.equal((await request(path, other.cookie, "PUT", edited)).status, 403);
    assert.equal((await request(`/events/${randomUUID()}`, owner.cookie, "PUT", edited)).status, 404);
    assert.equal((await request("/events/not-a-uuid", owner.cookie, "PUT", edited)).status, 400);
    assert.equal((await request(path, owner.cookie, "PUT", { ...edited, capacity: 0 })).status, 400);

    // The creator edits; a request body cannot reassign ownership.
    const updated = await request(path, owner.cookie, "PUT", { ...edited, createdByUserId: other.user.userId });
    assert.equal(updated.status, 200);
    const updatedEvent = z.object({ title: z.string(), createdByUserId: z.string() }).parse(await updated.json());
    assert.equal(updatedEvent.title, "Edited by the creator");
    assert.equal(updatedEvent.createdByUserId, owner.user.userId);
    assert.equal(eventSchema.parse(await (await request(path, student.cookie)).json()).title, "Edited by the creator");

    // Only the creator can invite, and the invited person must already have an account.
    const editors = `${path}/editors`;
    assert.equal((await request(editors, other.cookie, "POST", { email: "editor@howard.edu" })).status, 403);
    assert.equal((await request(editors, owner.cookie, "POST", { email: "nobody@howard.edu" })).status, 404);
    assert.equal((await request(editors, owner.cookie, "POST", { email: "owner@howard.edu" })).status, 400);
    assert.equal((await request(editors, owner.cookie, "POST", { email: "not an email" })).status, 400);
    assert.equal((await request(editors, owner.cookie, "POST", { email: "EDITOR@howard.edu" })).status, 201);
    assert.equal((await request(editors, owner.cookie, "POST", { email: "editor@howard.edu" })).status, 200);

    // Any registered account can be invited, including a plain student account.
    assert.equal((await request(editors, owner.cookie, "POST", { email: "plain-student@howard.edu" })).status, 201);
    const byStudent = await request(path, student.cookie, "PUT", { ...eventBody(), title: "Edited by an invited student" });
    assert.equal(byStudent.status, 200);
    assert.equal(eventSchema.parse(await byStudent.json()).title, "Edited by an invited student");
    assert.equal((await request(editors, student.cookie, "POST", { email: "other-officer@howard.edu" })).status, 403);

    // An invited editor can edit and see the editors, but cannot delete, invite, or remove others.
    const second = await request(path, editor.cookie, "PUT", { ...eventBody(), title: "Edited by an invited officer" });
    assert.equal(second.status, 200);
    assert.equal(eventSchema.parse(await second.json()).title, "Edited by an invited officer");
    assert.equal((await request(path, editor.cookie, "DELETE")).status, 403);
    assert.equal((await request(editors, editor.cookie, "POST", { email: "other-officer@howard.edu" })).status, 403);
    assert.equal((await request(`${editors}/${other.user.userId}`, editor.cookie, "DELETE")).status, 403);
    const listed = z.array(z.object({ userId: z.string(), email: z.string() })).parse(await (await request(editors, editor.cookie)).json());
    assert.deepEqual(listed.map(item => item.email).sort(), ["editor@howard.edu", "plain-student@howard.edu"]);
    assert.equal((await request(editors, other.cookie)).status, 403);

    // The creator can remove an editor, and an editor can leave on their own.
    assert.equal((await request(`${editors}/${editor.user.userId}`, owner.cookie, "DELETE")).status, 204);
    assert.equal((await request(path, editor.cookie, "PUT", edited)).status, 403);
    assert.equal((await request(editors, owner.cookie, "POST", { email: "editor@howard.edu" })).status, 201);
    assert.equal((await request(`${editors}/${editor.user.userId}`, editor.cookie, "DELETE")).status, 204);
    assert.equal((await request(path, editor.cookie, "PUT", edited)).status, 403);
    assert.equal((await request(`${editors}/${student.user.userId}`, student.cookie, "DELETE")).status, 204);
    assert.equal((await request(path, student.cookie, "PUT", edited)).status, 403);

    // Only the creator can delete, and deleting removes saves and editors with the event.
    assert.equal((await request(editors, owner.cookie, "POST", { email: "editor@howard.edu" })).status, 201);
    assert.equal((await request(`/bookmarks/${created.id}`, student.cookie, "PUT")).status, 204);
    assert.equal((await request(path, other.cookie, "DELETE")).status, 403);
    assert.equal((await request(path, student.cookie, "DELETE")).status, 403);
    assert.equal((await request(path, owner.cookie, "DELETE")).status, 204);
    assert.equal((await request(path, owner.cookie)).status, 404);
    assert.equal((await request(path, owner.cookie, "DELETE")).status, 404);
    assert.equal((await pool.query("SELECT count(*) FROM api_event_saves WHERE event_id=$1", [created.id])).rows[0].count, "0");
    assert.equal((await pool.query("SELECT count(*) FROM api_event_editors WHERE event_id=$1", [created.id])).rows[0].count, "0");
  });
});
