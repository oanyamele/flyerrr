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
const orgSchema = z.object({ id: z.string(), name: z.string(), handle: z.string(), myRole: z.string().nullable() });
const orgEventSchema = z.object({ id: z.string(), org: z.object({ id: z.string(), name: z.string(), handle: z.string() }) });
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

  it("accepts student addresses on bison.howard.edu and rejects look-alike domains", async () => {
    const student = await register("bison-student@bison.howard.edu");
    assert.equal(student.user.role, "student");
    const login = await request("/auth/login", "", "POST", { email: "Bison-Student@BISON.HOWARD.EDU", password: "GoodPassword123" });
    assert.equal(login.status, 200);
    const lookalike = await request("/auth/register", "", "POST", { email: "x@howard.edu.example.com", name: "Test Student", password: "GoodPassword123" });
    assert.equal(lookalike.status, 400);
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

  it("ties every event to an organization and lets leaders manage it", async () => {
    const lead = await register("lead@howard.edu");
    const second = await register("second-officer@howard.edu");
    const student = await register("org-student@howard.edu");
    const outsider = await register("outsider@howard.edu");
    await pool.query("UPDATE api_users SET role='org_officer' WHERE id = ANY($1::uuid[])", [[lead.user.userId, second.user.userId, outsider.user.userId]]);
    const publish = (cookie: string, extra: object = {}) => request("/events", cookie, "POST", { ...eventBody(), ...extra });

    // With no organization named, an officer who leads none gets a default one, then reuses it.
    const first = orgEventSchema.parse(await (await publish(lead.cookie)).json());
    assert.equal(first.org.name, "Test Student Org");
    assert.match(first.org.handle, /^@teststudent_[0-9a-f]{6}$/);
    assert.equal(orgEventSchema.parse(await (await publish(lead.cookie)).json()).org.id, first.org.id);
    const mine = z.array(orgSchema).parse(await (await request("/organizations", lead.cookie)).json());
    assert.deepEqual(mine.map(org => [org.id, org.myRole]), [[first.org.id, "leader"]]);
    assert.deepEqual(z.array(orgSchema).parse(await (await request("/organizations", student.cookie)).json()), []);

    // Creating organizations: officers only, valid and unique handles.
    const body = { name: "Debate Club", handle: "debate_club" };
    assert.equal((await request("/organizations", student.cookie, "POST", body)).status, 403);
    assert.equal((await request("/organizations", lead.cookie, "POST", { ...body, handle: "no spaces" })).status, 400);
    const debate = await request("/organizations", lead.cookie, "POST", body);
    assert.equal(debate.status, 201);
    const club = orgSchema.parse(await debate.json());
    assert.equal(club.handle, "@debate_club");
    assert.equal(club.myRole, "leader");
    assert.equal((await request("/organizations", outsider.cookie, "POST", { name: "Copycat", handle: "@DEBATE_CLUB" })).status, 409);
    assert.equal(orgSchema.parse(await (await request(`/organizations/${club.id}`, outsider.cookie)).json()).myRole, null);
    assert.equal((await request(`/organizations/${randomUUID()}`, lead.cookie)).status, 404);

    // Leading two organizations means choosing one; naming one you do not lead is refused.
    assert.equal((await publish(lead.cookie)).status, 400);
    const chosen = orgEventSchema.parse(await (await publish(lead.cookie, { organizationId: club.id })).json());
    assert.equal(chosen.org.handle, "@debate_club");
    assert.equal((await publish(outsider.cookie, { organizationId: club.id })).status, 403);
    assert.equal((await publish(outsider.cookie, { organizationId: randomUUID() })).status, 403);
    assert.equal((await publish(lead.cookie, { organizationId: "not-a-uuid" })).status, 400);
    assert.equal(orgEventSchema.parse(await (await request(`/events/${chosen.id}`, student.cookie)).json()).org.id, club.id);

    // Members: any registered account can be added; only leaders add, remove or promote.
    const members = `/organizations/${club.id}/members`;
    assert.equal((await request(members, lead.cookie, "POST", { email: "nobody@howard.edu" })).status, 404);
    assert.equal((await request(members, lead.cookie, "POST", { email: "org-student@howard.edu" })).status, 201);
    assert.equal((await request(members, lead.cookie, "POST", { email: "second-officer@howard.edu" })).status, 201);
    assert.equal((await request(members, lead.cookie, "POST", { email: "second-officer@howard.edu" })).status, 200);
    assert.equal(orgSchema.parse(await (await request(`/organizations/${club.id}`, student.cookie)).json()).myRole, "member");
    assert.equal((await request(members, student.cookie, "POST", { email: "outsider@howard.edu" })).status, 403);
    assert.equal((await request(members, outsider.cookie, "POST", { email: "outsider@howard.edu" })).status, 404);
    assert.equal((await request(members, outsider.cookie)).status, 403);
    const listed = z.array(z.object({ email: z.string(), role: z.string() })).parse(await (await request(members, student.cookie)).json());
    assert.deepEqual(listed.map(m => [m.email, m.role]).sort(), [["lead@howard.edu", "leader"], ["org-student@howard.edu", "member"], ["second-officer@howard.edu", "member"]]);

    // A plain member cannot publish or manage events for the organization.
    assert.equal((await publish(second.cookie, { organizationId: club.id })).status, 403);
    assert.equal((await request(`/events/${chosen.id}`, second.cookie, "PUT", eventBody())).status, 403);
    assert.equal((await request(`/events/${chosen.id}/editors`, second.cookie, "POST", { email: "outsider@howard.edu" })).status, 403);

    // A leader of the organization manages its events even though someone else created them.
    assert.equal((await request(members, lead.cookie, "POST", { email: "second-officer@howard.edu", role: "leader" })).status, 200);
    assert.equal((await publish(second.cookie, { organizationId: club.id })).status, 201);
    assert.equal((await request(`/events/${chosen.id}`, second.cookie, "PUT", { ...eventBody(), title: "Edited by a leader" })).status, 200);
    assert.equal((await request(`/events/${chosen.id}/editors`, second.cookie, "POST", { email: "outsider@howard.edu" })).status, 201);
    assert.equal((await request(`/events/${chosen.id}`, student.cookie, "PUT", eventBody())).status, 403);
    assert.equal((await request(`/events/${chosen.id}`, second.cookie, "DELETE")).status, 204);

    // Removing members: leaders remove anyone, members only themselves, and one leader must remain.
    assert.equal((await request(`${members}/${lead.user.userId}`, student.cookie, "DELETE")).status, 403);
    assert.equal((await request(`${members}/${student.user.userId}`, student.cookie, "DELETE")).status, 204);
    assert.equal((await request(`/organizations/${club.id}`, student.cookie)).status, 200);
    assert.equal((await request(members, student.cookie)).status, 403);
    assert.equal((await request(members, lead.cookie, "POST", { email: "second-officer@howard.edu", role: "member" })).status, 200);
    assert.equal((await request(members, lead.cookie, "POST", { email: "lead@howard.edu", role: "member" })).status, 409);
    assert.equal((await request(`${members}/${lead.user.userId}`, lead.cookie, "DELETE")).status, 409);
    assert.equal((await request(members, lead.cookie, "POST", { email: "second-officer@howard.edu", role: "leader" })).status, 200);
    assert.equal((await request(`${members}/${lead.user.userId}`, lead.cookie, "DELETE")).status, 204);
    assert.equal((await request(members, lead.cookie)).status, 403);
  });

  it("lets a leader rename and delete an organization", async () => {
    const lead = await register("crud-lead@howard.edu");
    const member = await register("crud-member@howard.edu");
    const stranger = await register("crud-stranger@howard.edu");
    await pool.query("UPDATE api_users SET role='org_officer' WHERE id=$1", [lead.user.userId]);
    const created = orgSchema.parse(await (await request("/organizations", lead.cookie, "POST", { name: "Chess Club", handle: "chess_club" })).json());
    const other = orgSchema.parse(await (await request("/organizations", lead.cookie, "POST", { name: "Go Club", handle: "go_club" })).json());
    const path = `/organizations/${created.id}`;
    assert.equal((await request(`/organizations/${created.id}/members`, lead.cookie, "POST", { email: "crud-member@howard.edu" })).status, 201);

    // Only a leader can edit; a non-member cannot even tell that it exists.
    assert.equal((await request(path, member.cookie, "PUT", { name: "Hijacked" })).status, 403);
    assert.equal((await request(path, stranger.cookie, "PUT", { name: "Hijacked" })).status, 404);
    assert.equal((await request(path, lead.cookie, "PUT", {})).status, 400);
    assert.equal((await request(path, lead.cookie, "PUT", { name: "x" })).status, 400);
    assert.equal((await request(path, lead.cookie, "PUT", { handle: "bad handle" })).status, 400);

    const renamed = orgSchema.parse(await (await request(path, lead.cookie, "PUT", { name: "Chess and Strategy Club" })).json());
    assert.deepEqual([renamed.id, renamed.name, renamed.handle, renamed.myRole], [created.id, "Chess and Strategy Club", "@chess_club", "leader"]);
    const rehandled = orgSchema.parse(await (await request(path, lead.cookie, "PUT", { handle: "@Chess_HQ" })).json());
    assert.deepEqual([rehandled.name, rehandled.handle], ["Chess and Strategy Club", "@Chess_HQ"]);
    assert.equal((await request(path, lead.cookie, "PUT", { handle: "GO_CLUB" })).status, 409);
    assert.equal(orgSchema.parse(await (await request(path, member.cookie)).json()).name, "Chess and Strategy Club");

    // An organization with events cannot be deleted; once they are gone, only a leader can delete it.
    const event = orgEventSchema.parse(await (await request("/events", lead.cookie, "POST", { ...eventBody(), organizationId: created.id })).json());
    assert.equal((await request(path, lead.cookie, "DELETE")).status, 409);
    assert.equal((await request(`/events/${event.id}`, lead.cookie, "DELETE")).status, 204);
    assert.equal((await request(path, member.cookie, "DELETE")).status, 403);
    assert.equal((await request(path, stranger.cookie, "DELETE")).status, 404);
    assert.equal((await request(path, lead.cookie, "DELETE")).status, 204);
    assert.equal((await request(path, lead.cookie)).status, 404);
    assert.equal((await request(path, lead.cookie, "DELETE")).status, 404);
    assert.equal((await pool.query("SELECT count(*) FROM api_organization_members WHERE organization_id=$1", [created.id])).rows[0].count, "0");
    assert.equal((await request(`/organizations/${other.id}`, lead.cookie)).status, 200);
  });
});
