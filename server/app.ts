import { createHash, randomBytes, randomUUID } from "node:crypto";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import { hash, verify } from "@node-rs/argon2";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import { authFormSchema, eventFormSchema } from "../shared/forms";
import { CHECK_IN_TTL_SECONDS, MIN_SECRET_LENGTH, readCheckInToken, signCheckInToken } from "./checkIn";

const COOKIE = "flyerrr_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const idSchema = z.string().uuid();
interface User { id: string; email: string; name: string; role: "student" | "org_officer" }
type EventInput = z.infer<typeof eventFormSchema>;
const imageSchema = z.string().max(11_000_000).regex(/^(https:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp);base64,)/);
// Publishing and editing share this so both enforce identical validation.
const parseEventForm = (body: Record<string, unknown>) => {
  const { tags } = body;
  return {
    input: eventFormSchema.parse({ ...body, capacity: String(body.capacity ?? ""), tags: Array.isArray(tags) ? tags.join(",") : tags }),
    startsAt: z.string().datetime({ offset: true }).parse(body.startsAt),
  };
};
const handleSchema = z.string().trim().transform(value => value.replace(/^@/, "")).pipe(z.string().regex(/^[A-Za-z0-9_]{3,30}$/, "Use 3 to 30 letters, numbers or underscores."));
const organizationSchema = z.object({ name: z.string().trim().min(2).max(80), handle: handleSchema });
const organizationUpdateSchema = z.object({ name: organizationSchema.shape.name.optional(), handle: handleSchema.optional() })
  .refine(value => value.name !== undefined || value.handle !== undefined, { message: "Send a name, a handle, or both." });
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "org";
// The organization as the client's OrgProfile expects it. Verification and follower counts
// are not stored yet, so they are fixed at their defaults.
const orgJson = (alias: string) => `jsonb_build_object('id', ${alias}.id, 'name', ${alias}.name, 'handle', '@' || ${alias}.handle,
  'avatar', upper(left(${alias}.name, 2)), 'verified', false, 'followerCount', 0)`;
// The editable fields of an event. Ownership, org, counters and createdAt are never taken from a request.
const eventFields = (input: EventInput, image: string) => ({
  title: input.title, description: input.description, category: input.category,
  date: input.date, time: input.time, location: input.location, capacity: Number(input.capacity) || 100,
  tags: input.tags.split(",").map(t => t.trim()).filter(Boolean), image,
});

// Thrown inside a transaction to roll it back and answer with a specific status.
class Rejected extends Error {
  status: number;
  body: Record<string, unknown>;
  constructor(status: number, body: Record<string, unknown>) {
    super(String(body.error));
    this.status = status;
    this.body = body;
  }
}

export const createApi = async (pool: Pool, options: { origin: string; secureCookies: boolean; checkInSecret?: string }) => {
  // Signs check-in codes. A deployment must set one shared secret; without it each process
  // makes its own, so codes only work on the instance that issued them.
  if (options.checkInSecret !== undefined && options.checkInSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`The check-in secret must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
  const checkInSecret = options.checkInSecret ?? randomBytes(32).toString("hex");
  const app = express();
  const dummyHash = await hash(randomBytes(32).toString("hex"));
  app.disable("x-powered-by");
  app.use(express.json({ limit: "12mb" }));
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    // Same-site API, proxied by Vite in development. Reject cross-origin writes
    // before processing credentials or issuing/changing a session.
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("origin") !== options.origin) {
      res.status(403).json({ error: "Request origin is not allowed." });
      return;
    }
    next();
  });

  // Bound credential attempts per IP and email. This single-process limiter is
  // deliberately small; a multi-instance deployment needs a shared limiter.
  const attempts = new Map<string, { count: number; expires: number }>();
  app.use("/api/auth", (req, res, next) => {
    if (req.method !== "POST" || !["/login", "/register"].includes(req.path)) return next();
    const now = Date.now();
    for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
    const keys = [`ip:${req.ip}`, `email:${String(req.body?.email ?? "").toLowerCase().slice(0, 254)}`];
    if (keys.some(key => (attempts.get(key)?.count ?? 0) >= 30) || attempts.size >= 10_000) {
      res.set("Retry-After", "900").status(429).json({ error: "Too many attempts. Try again later." });
      return;
    }
    for (const key of keys) {
      const entry = attempts.get(key) ?? { count: 0, expires: now + 900_000 };
      entry.count++;
      attempts.set(key, entry);
    }
    next();
  });

  const tokenFrom = (req: Request) => {
    const token = req.headers.cookie?.split(";").map(p => p.trim()).find(p => p.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
  };
  const userFrom = async (req: Request): Promise<User | null> => {
    const token = tokenFrom(req);
    if (!token) return null;
    const result = await pool.query<User>(
      `SELECT u.id, u.email, u.name, u.role FROM api_users u
       JOIN api_sessions s ON s.user_id = u.id WHERE s.token_hash = $1 AND s.expires_at > now()`, [digest(token)],
    );
    return result.rows[0] ?? null;
  };
  const session = (user: User) => ({ isLoggedIn: true, userId: user.id, userName: user.name, email: user.email, role: user.role });
  const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: options.secureCookies, path: "/" };
  const issueSession = async (req: Request, res: Response, user: User) => {
    const old = tokenFrom(req);
    if (old) await pool.query("DELETE FROM api_sessions WHERE token_hash = $1", [digest(old)]);
    await pool.query("DELETE FROM api_sessions WHERE expires_at <= now()");
    const token = randomBytes(32).toString("hex");
    await pool.query("INSERT INTO api_sessions(token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [digest(token), user.id, new Date(Date.now() + SESSION_SECONDS * 1000)]);
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: SESSION_SECONDS * 1000 });
    res.json(session(user));
  };

  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  });
  app.get("/api/auth/session", async (req, res) => {
    const user = await userFrom(req);
    res.json(user ? session(user) : { isLoggedIn: false, role: "student", userName: "" });
  });
  app.post("/api/auth/register", async (req, res) => {
    const input = authFormSchema("signup").parse(req.body);
    const user: User = { id: randomUUID(), email: input.email.toLowerCase(), name: input.name, role: "student" };
    const result = await pool.query(
      `INSERT INTO api_users(id,email,password_hash,name) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING RETURNING id`,
      [user.id, user.email, await hash(input.password), user.name],
    );
    if (!result.rowCount) return void res.status(409).json({ error: "Unable to create an account with these details." });
    await issueSession(req, res, user);
  });
  app.post("/api/auth/login", async (req, res) => {
    const input = authFormSchema("signin").parse({ name: "", ...req.body });
    const result = await pool.query<User & { password_hash: string }>("SELECT id,email,name,role,password_hash FROM api_users WHERE email = $1", [input.email.toLowerCase()]);
    const user = result.rows[0];
    const valid = await verify(user?.password_hash ?? dummyHash, input.password);
    if (!user || !valid) return void res.status(401).json({ error: "Invalid email or password." });
    await issueSession(req, res, user);
  });
  app.post("/api/auth/logout", async (req, res) => {
    const token = tokenFrom(req);
    if (token) await pool.query("DELETE FROM api_sessions WHERE token_hash = $1", [digest(token)]);
    res.clearCookie(COOKIE, cookieOptions).sendStatus(204);
  });

  // Identity is resolved from the server session on every request. Request bodies,
  // localStorage, query strings and client-supplied roles never choose a user.
  app.use("/api", async (req, res, next) => {
    const user = await userFrom(req);
    if (!user) return void res.status(401).json({ error: "Sign in to continue." });
    res.locals.user = user;
    next();
  });

  const eventSelect = `SELECT e.payload || jsonb_build_object('saved', s.event_id IS NOT NULL, 'org', ${orgJson("o")}) AS event
    FROM api_events e JOIN api_organizations o ON o.id = e.organization_id
    LEFT JOIN api_event_saves s ON s.event_id=e.id AND s.user_id=$1`;
  app.get("/api/events", async (_req, res) => {
    const result = await pool.query(`${eventSelect} ORDER BY e.created_at DESC, e.id`, [res.locals.user.id]);
    res.json(result.rows.map(row => row.event));
  });
  app.get("/api/events/:id", async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const result = await pool.query(`${eventSelect} WHERE e.id=$2`, [res.locals.user.id, id]);
    if (!result.rows[0]) return void res.status(404).json({ error: "Event not found." });
    res.json(result.rows[0].event);
  });
  const transaction = async <T>(work: (db: PoolClient) => Promise<T>) => {
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const result = await work(db);
      await db.query("COMMIT");
      return result;
    } catch (error) {
      await db.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      db.release();
    }
  };
  const createOrganization = async (db: PoolClient, userId: string, name: string, handle: string) => {
    const id = randomUUID();
    await db.query("INSERT INTO api_organizations(id,name,handle,created_by) VALUES ($1,$2,$3,$4)", [id, name, handle, userId]);
    await db.query("INSERT INTO api_organization_members(organization_id,user_id,role) VALUES ($1,$2,'leader')", [id, userId]);
    return id;
  };
  const organizationRole = async (organizationId: string, userId: string) => (await pool.query<{ role: "member" | "leader" }>(
    "SELECT role FROM api_organization_members WHERE organization_id=$1 AND user_id=$2", [organizationId, userId],
  )).rows[0]?.role ?? null;
  type Refusal = { status: number; error: string };
  // Every event needs an organization. If the request names one, the caller must lead it.
  // If not, use the one organization the caller leads, or create a default one when they
  // lead none. A leader of several organizations has to choose.
  const organizationForEvent = async (user: User, requested: unknown): Promise<string | Refusal> => {
    if (requested !== undefined && requested !== null && requested !== "") {
      const organizationId = idSchema.parse(requested);
      return (await organizationRole(organizationId, user.id)) === "leader"
        ? organizationId
        : { status: 403, error: "Only a leader of that organization can publish events for it." };
    }
    return transaction(async db => {
      await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`default-organization:${user.id}`]);
      const led = (await db.query<{ id: string }>(
        "SELECT organization_id AS id FROM api_organization_members WHERE user_id=$1 AND role='leader' ORDER BY created_at, organization_id", [user.id],
      )).rows;
      if (led.length > 1) return { status: 400, error: "You lead more than one organization. Send organizationId to choose one." };
      if (led.length === 1) return led[0].id;
      return createOrganization(db, user.id, `${user.name} Org`.slice(0, 80), `${slug(user.name)}_${randomBytes(3).toString("hex")}`);
    });
  };
  app.post("/api/events", async (req, res) => {
    const user: User = res.locals.user;
    if (user.role !== "org_officer") return void res.status(403).json({ error: "Only an organization officer can publish events." });
    const body = req.body ?? {};
    const { input, startsAt } = parseEventForm(body);
    if (new Date(startsAt).getTime() <= Date.now()) return void res.status(400).json({ error: "Event date and time must be in the future." });
    const image = imageSchema.parse(body.image);
    const organizationId = await organizationForEvent(user, body.organizationId);
    if (typeof organizationId !== "string") return void res.status(organizationId.status).json({ error: organizationId.error });
    const id = randomUUID();
    const event = {
      id, ...eventFields(input, image),
      attendees: 0, likes: 0, friendsGoing: [], createdAt: new Date().toISOString(), createdByUserId: user.id,
    };
    await pool.query("INSERT INTO api_events(id,created_by,starts_at,payload,organization_id) VALUES ($1,$2,$3,$4,$5)", [id, user.id, startsAt, event, organizationId]);
    const result = await pool.query(`${eventSelect} WHERE e.id=$2`, [user.id, id]);
    res.status(201).json(result.rows[0].event);
  });

  // Event permissions. The officer who created an event owns it, and so does any leader of
  // its organization: they can edit it, delete it, and invite other people to edit it. An invited editor can be any registered account,
  // officer or student. Editors can edit but cannot delete the event or change its editors,
  // except to remove themself. These checks are per event, not by account role.
  const eventAccess = async (eventId: string, userId: string) => {
    const result = await pool.query<{ created_by: string; is_editor: boolean; is_leader: boolean }>(
      `SELECT e.created_by,
              EXISTS (SELECT 1 FROM api_organization_members m WHERE m.organization_id = e.organization_id AND m.user_id = $2 AND m.role = 'leader') AS is_leader,
              EXISTS (SELECT 1 FROM api_event_editors x WHERE x.event_id = e.id AND x.user_id = $2) AS is_editor
       FROM api_events e WHERE e.id = $1`, [eventId, userId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const isOwner = row.created_by === userId || row.is_leader;
    return { isOwner, canEdit: isOwner || row.is_editor };
  };
  app.put("/api/events/:id", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const access = await eventAccess(id, user.id);
    if (!access) return void res.status(404).json({ error: "Event not found." });
    if (!access.canEdit) return void res.status(403).json({ error: "Only the event's creator or an invited editor can edit it." });
    const body = req.body ?? {};
    const { input, startsAt } = parseEventForm(body);
    if (new Date(startsAt).getTime() <= Date.now()) return void res.status(400).json({ error: "Event date and time must be in the future." });
    const image = imageSchema.parse(body.image);
    const updated = await pool.query("UPDATE api_events SET starts_at=$2, payload = payload || $3::jsonb WHERE id=$1", [id, startsAt, JSON.stringify(eventFields(input, image))]);
    if (!updated.rowCount) return void res.status(404).json({ error: "Event not found." });
    const result = await pool.query(`${eventSelect} WHERE e.id=$2`, [user.id, id]);
    res.json(result.rows[0].event);
  });
  app.delete("/api/events/:id", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const access = await eventAccess(id, user.id);
    if (!access) return void res.status(404).json({ error: "Event not found." });
    if (!access.isOwner) return void res.status(403).json({ error: "Only the event's creator or a leader of its organization can delete it." });
    await pool.query("DELETE FROM api_events WHERE id=$1", [id]);
    res.sendStatus(204);
  });
  app.get("/api/events/:id/editors", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const access = await eventAccess(id, user.id);
    if (!access) return void res.status(404).json({ error: "Event not found." });
    if (!access.canEdit) return void res.status(403).json({ error: "Only the event's creator or an invited editor can view its editors." });
    const result = await pool.query(
      `SELECT u.id AS "userId", u.name, u.email, x.created_at AS "addedAt"
       FROM api_event_editors x JOIN api_users u ON u.id = x.user_id
       WHERE x.event_id = $1 ORDER BY x.created_at, u.id`, [id],
    );
    res.json(result.rows);
  });
  app.post("/api/events/:id/editors", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const access = await eventAccess(id, user.id);
    if (!access) return void res.status(404).json({ error: "Event not found." });
    if (!access.isOwner) return void res.status(403).json({ error: "Only the event's creator or a leader of its organization can invite editors." });
    const { email } = z.object({ email: z.string().trim().max(254).email() }).parse(req.body ?? {});
    // Any registered account can be invited, officer or student. The person must have signed
    // up, because access goes to an account, not to an unverified email address.
    const target = (await pool.query<{ id: string; name: string; email: string }>(
      "SELECT id, name, email FROM api_users WHERE email = $1", [email.toLowerCase()],
    )).rows[0];
    if (!target) return void res.status(404).json({ error: "No account found for that email. They need to sign up first." });
    if (target.id === user.id) return void res.status(400).json({ error: "You already own this event." });
    const added = await pool.query("INSERT INTO api_event_editors(event_id,user_id,added_by) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [id, target.id, user.id]);
    res.status(added.rowCount ? 201 : 200).json({ userId: target.id, name: target.name, email: target.email });
  });
  app.delete("/api/events/:id/editors/:userId", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const editorId = idSchema.parse(req.params.userId);
    const access = await eventAccess(id, user.id);
    if (!access) return void res.status(404).json({ error: "Event not found." });
    if (!access.isOwner && editorId !== user.id) return void res.status(403).json({ error: "Only the event's creator or a leader of its organization can remove other editors." });
    await pool.query("DELETE FROM api_event_editors WHERE event_id=$1 AND user_id=$2", [id, editorId]);
    res.sendStatus(204);
  });

  const organizations = async (userId: string, where = "", params: unknown[] = []) => {
    const result = await pool.query<{ org: object; myRole: string | null }>(
      `SELECT ${orgJson("o")} AS org, m.role AS "myRole" FROM api_organizations o
       LEFT JOIN api_organization_members m ON m.organization_id = o.id AND m.user_id = $1 ${where}
       ORDER BY o.created_at, o.id`, [userId, ...params],
    );
    return result.rows.map(row => ({ ...row.org, myRole: row.myRole }));
  };
  app.get("/api/organizations", async (_req, res) => {
    res.json(await organizations(res.locals.user.id, "WHERE m.user_id IS NOT NULL"));
  });
  app.post("/api/organizations", async (req, res) => {
    const user: User = res.locals.user;
    if (user.role !== "org_officer") return void res.status(403).json({ error: "Only an organization officer can create an organization." });
    const { name, handle } = organizationSchema.parse(req.body ?? {});
    let id: string;
    try {
      id = await transaction(db => createOrganization(db, user.id, name, handle));
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return void res.status(409).json({ error: "That handle is already taken." });
      throw error;
    }
    res.status(201).json((await organizations(user.id, "WHERE o.id = $2", [id]))[0]);
  });
  app.get("/api/organizations/:id", async (req, res) => {
    const found = (await organizations(res.locals.user.id, "WHERE o.id = $2", [idSchema.parse(req.params.id)]))[0];
    if (!found) return void res.status(404).json({ error: "Organization not found." });
    res.json(found);
  });
  // Leaders rename an organization or change its handle. Followers and events keep pointing at
  // it, because they use its id.
  app.put("/api/organizations/:id", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const role = await organizationRole(id, user.id);
    if (!role) return void res.status(404).json({ error: "Organization not found." });
    if (role !== "leader") return void res.status(403).json({ error: "Only a leader can edit the organization." });
    const changes = organizationUpdateSchema.parse(req.body ?? {});
    try {
      await pool.query(
        "UPDATE api_organizations SET name = COALESCE($2, name), handle = COALESCE($3, handle) WHERE id = $1",
        [id, changes.name ?? null, changes.handle ?? null],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return void res.status(409).json({ error: "That handle is already taken." });
      throw error;
    }
    res.json((await organizations(user.id, "WHERE o.id = $2", [id]))[0]);
  });
  // An organization that still has events cannot be deleted, because deleting it would
  // orphan or destroy them. Delete or finish the events first.
  app.delete("/api/organizations/:id", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const role = await organizationRole(id, user.id);
    if (!role) return void res.status(404).json({ error: "Organization not found." });
    if (role !== "leader") return void res.status(403).json({ error: "Only a leader can delete the organization." });
    try {
      await pool.query("DELETE FROM api_organizations WHERE id = $1", [id]);
    } catch (error) {
      if ((error as { code?: string }).code === "23503") return void res.status(409).json({ error: "This organization still has events. Delete them first." });
      throw error;
    }
    res.sendStatus(204);
  });
  app.get("/api/organizations/:id/members", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    if (!(await organizationRole(id, user.id))) return void res.status(403).json({ error: "Only members of this organization can see its members." });
    const result = await pool.query(
      `SELECT u.id AS "userId", u.name, u.email, m.role FROM api_organization_members m
       JOIN api_users u ON u.id = m.user_id WHERE m.organization_id = $1 ORDER BY m.created_at, u.id`, [id],
    );
    res.json(result.rows);
  });
  // A member can be any registered account, officer or student. Adding someone who is already
  // a member changes their role. An organization always keeps at least one leader.
  const leaderCount = async (organizationId: string) => Number((await pool.query(
    "SELECT count(*) FROM api_organization_members WHERE organization_id=$1 AND role='leader'", [organizationId],
  )).rows[0].count);
  app.post("/api/organizations/:id/members", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const role = await organizationRole(id, user.id);
    if (!role) return void res.status(404).json({ error: "Organization not found." });
    if (role !== "leader") return void res.status(403).json({ error: "Only a leader can add members." });
    const input = z.object({ email: z.string().trim().max(254).email(), role: z.enum(["member", "leader"]).default("member") }).parse(req.body ?? {});
    const target = (await pool.query<{ id: string; name: string; email: string }>("SELECT id, name, email FROM api_users WHERE email = $1", [input.email.toLowerCase()])).rows[0];
    if (!target) return void res.status(404).json({ error: "No account found for that email. They need to sign up first." });
    const current = await organizationRole(id, target.id);
    if (current === "leader" && input.role === "member" && (await leaderCount(id)) < 2) {
      return void res.status(409).json({ error: "An organization needs at least one leader." });
    }
    await pool.query(
      `INSERT INTO api_organization_members(organization_id,user_id,role) VALUES ($1,$2,$3)
       ON CONFLICT (organization_id,user_id) DO UPDATE SET role = EXCLUDED.role`, [id, target.id, input.role],
    );
    res.status(current ? 200 : 201).json({ userId: target.id, name: target.name, email: target.email, role: input.role });
  });
  app.delete("/api/organizations/:id/members/:userId", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const memberId = idSchema.parse(req.params.userId);
    const role = await organizationRole(id, user.id);
    if (!role) return void res.status(404).json({ error: "Organization not found." });
    if (role !== "leader" && memberId !== user.id) return void res.status(403).json({ error: "Only a leader can remove other members." });
    if ((await organizationRole(id, memberId)) === "leader" && (await leaderCount(id)) < 2) {
      return void res.status(409).json({ error: "An organization needs at least one leader." });
    }
    await pool.query("DELETE FROM api_organization_members WHERE organization_id=$1 AND user_id=$2", [id, memberId]);
    res.sendStatus(204);
  });

  // Check-in. A signed-in person asks for a short-lived code for an event, and shows it as a
  // QR code. An officer who manages the event submits it from their own device. The code is
  // signed with a secret only the server holds, expires 2 minutes after the server issues it,
  // and works once. Expiry and single use are decided by the database, not by any device clock.
  app.post("/api/events/:id/check-in-tokens", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    if (!(await pool.query("SELECT 1 FROM api_events WHERE id = $1", [id])).rowCount) return void res.status(404).json({ error: "Event not found." });
    const nonce = randomUUID();
    const expiresAt = Number((await pool.query<{ expires: string }>("SELECT floor(extract(epoch FROM now()))::bigint + $1 AS expires", [CHECK_IN_TTL_SECONDS])).rows[0].expires);
    const token = signCheckInToken(checkInSecret, { nonce, eventId: id, userId: user.id, expiresAt });
    // One live code per person and event: asking again replaces the previous one. Old unused codes are cleaned up here.
    await pool.query("DELETE FROM api_check_in_nonces WHERE consumed_at IS NULL AND ((event_id = $1 AND user_id = $2) OR expires_at < now() - interval '1 day')", [id, user.id]);
    await pool.query("INSERT INTO api_check_in_nonces(id,event_id,user_id,token_digest,expires_at) VALUES ($1,$2,$3,$4,to_timestamp($5))", [nonce, id, user.id, digest(token), expiresAt]);
    res.status(201).json({ token, expiresAt: new Date(expiresAt * 1000).toISOString() });
  });
  app.post("/api/events/:id/check-ins", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const access = await eventAccess(id, user.id);
    if (!access) return void res.status(404).json({ error: "Event not found." });
    if (!access.canEdit) return void res.status(403).json({ error: "Only the event's owner, an invited editor or a leader of its organization can check people in." });
    const { token } = z.object({ token: z.string().min(1).max(600) }).parse(req.body ?? {});
    const read = readCheckInToken(checkInSecret, token);
    if (!read.ok) return void res.status(400).json({ error: "This is not a valid check-in code.", code: "invalid" });
    const { claims } = read;
    if (claims.eventId !== id) return void res.status(400).json({ error: "This code is for a different event.", code: "wrong_event" });
    if (claims.expiresAt * 1000 <= Date.now()) return void res.status(410).json({ error: "This code has expired. Ask the student to refresh it.", code: "expired" });
    try {
      const checkedInAt = await transaction(async db => {
        const consumed = await db.query<{ user_id: string }>(
          `UPDATE api_check_in_nonces SET consumed_at = now(), consumed_by = $3
           WHERE id = $1 AND token_digest = $2 AND event_id = $4 AND consumed_at IS NULL AND expires_at > now() RETURNING user_id`,
          [claims.nonce, digest(token), user.id, id],
        );
        if (!consumed.rowCount || consumed.rows[0].user_id !== claims.userId) {
          const known = (await db.query<{ consumed_at: Date | null }>("SELECT consumed_at FROM api_check_in_nonces WHERE id = $1 AND token_digest = $2", [claims.nonce, digest(token)])).rows[0];
          if (known?.consumed_at) {
            const earlier = (await db.query<{ checked_in_at: Date }>("SELECT checked_in_at FROM api_attendance WHERE nonce_id = $1", [claims.nonce])).rows[0];
            throw new Rejected(409, { error: "This code was already used.", code: "already_used", checkedInAt: earlier?.checked_in_at });
          }
          throw new Rejected(410, { error: "This code is no longer valid. Ask the student to refresh it.", code: "expired" });
        }
        const inserted = await db.query<{ checked_in_at: Date }>(
          `INSERT INTO api_attendance(id,event_id,user_id,nonce_id,checked_in_by) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (event_id, user_id) DO NOTHING RETURNING checked_in_at`,
          [randomUUID(), id, claims.userId, claims.nonce, user.id],
        );
        if (!inserted.rowCount) {
          const earlier = (await db.query<{ checked_in_at: Date }>("SELECT checked_in_at FROM api_attendance WHERE event_id = $1 AND user_id = $2", [id, claims.userId])).rows[0];
          throw new Rejected(409, { error: "This person is already checked in.", code: "already_checked_in", checkedInAt: earlier?.checked_in_at });
        }
        return inserted.rows[0].checked_in_at;
      });
      const attendee = (await pool.query<{ userId: string; name: string; email: string }>(`SELECT id AS "userId", name, email FROM api_users WHERE id = $1`, [claims.userId])).rows[0];
      res.status(201).json({ attendee, checkedInAt });
    } catch (error) {
      if (error instanceof Rejected) return void res.status(error.status).json(error.body);
      throw error;
    }
  });
  app.get("/api/events/:id/attendance", async (req, res) => {
    const user: User = res.locals.user;
    const id = idSchema.parse(req.params.id);
    const access = await eventAccess(id, user.id);
    if (!access) return void res.status(404).json({ error: "Event not found." });
    if (!access.canEdit) return void res.status(403).json({ error: "Only the event's owner, an invited editor or a leader of its organization can see who checked in." });
    const result = await pool.query(
      `SELECT a.user_id AS "userId", u.name, u.email, a.checked_in_at AS "checkedInAt", a.checked_in_by AS "checkedInBy"
       FROM api_attendance a JOIN api_users u ON u.id = a.user_id WHERE a.event_id = $1 ORDER BY a.checked_in_at, a.user_id`, [id],
    );
    res.json(result.rows);
  });

  app.get("/api/bookmarks", async (_req, res) => {
    const result = await pool.query(`${eventSelect} WHERE s.event_id IS NOT NULL ORDER BY e.starts_at,e.id`, [res.locals.user.id]);
    res.json(result.rows.map(row => row.event));
  });
  app.put("/api/bookmarks/:id", async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const result = await pool.query(
      `INSERT INTO api_event_saves(user_id,event_id) SELECT $1,id FROM api_events WHERE id=$2 ON CONFLICT DO NOTHING`, [res.locals.user.id, id],
    );
    if (!result.rowCount && !(await pool.query("SELECT id FROM api_events WHERE id=$1", [id])).rowCount) return void res.status(404).json({ error: "Event not found." });
    res.sendStatus(204);
  });
  app.delete("/api/bookmarks/:id", async (req, res) => {
    await pool.query("DELETE FROM api_event_saves WHERE user_id=$1 AND event_id=$2", [res.locals.user.id, idSchema.parse(req.params.id)]);
    res.sendStatus(204);
  });
  app.use("/api", (_req, res) => { res.status(404).json({ error: "Endpoint not found." }); });
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    void _next; // Express identifies error handlers by their four-argument arity.
    if (error instanceof z.ZodError) return void res.status(400).json({ error: "Check the highlighted fields.", fields: error.flatten().fieldErrors });
    if (error?.type === "entity.too.large") return void res.status(413).json({ error: "Image is too large." });
    if (error?.code === "23505") return void res.status(409).json({ error: "That value is already in use." });
    if (error instanceof SyntaxError) return void res.status(400).json({ error: "Invalid JSON." });
    console.error("API operation failed", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Unable to complete this request. Try again." });
  };
  app.use(errors);
  return app;
};
