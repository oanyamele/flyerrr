import { createHash, randomBytes, randomUUID } from "node:crypto";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import { hash, verify } from "@node-rs/argon2";
import type { Pool } from "pg";
import { z } from "zod";
import { authFormSchema, eventFormSchema } from "../shared/forms";

const COOKIE = "flyerrr_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const idSchema = z.string().uuid();
interface User { id: string; email: string; name: string; role: "student" | "org_officer" }

export const createApi = async (pool: Pool, options: { origin: string; secureCookies: boolean }) => {
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

  const eventSelect = `SELECT e.payload || jsonb_build_object('saved', s.event_id IS NOT NULL) AS event
    FROM api_events e LEFT JOIN api_event_saves s ON s.event_id=e.id AND s.user_id=$1`;
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
  app.post("/api/events", async (req, res) => {
    const user: User = res.locals.user;
    if (user.role !== "org_officer") return void res.status(403).json({ error: "Only an organization officer can publish events." });
    const body = req.body ?? {};
    const input = eventFormSchema.parse({ ...body, capacity: String(body.capacity ?? ""), tags: Array.isArray(body.tags) ? body.tags.join(",") : body.tags });
    const startsAt = z.string().datetime({ offset: true }).parse(body.startsAt);
    if (new Date(startsAt).getTime() <= Date.now()) return void res.status(400).json({ error: "Event date and time must be in the future." });
    const image = z.string().max(11_000_000).regex(/^(https:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp);base64,)/).parse(body.image);
    const id = randomUUID();
    const event = {
      id, title: input.title, description: input.description, category: input.category,
      date: input.date, time: input.time, location: input.location, capacity: Number(input.capacity) || 100,
      tags: input.tags.split(",").map(t => t.trim()).filter(Boolean), image,
      org: { id: user.id, name: `${user.name} Org`, handle: `@${user.name.toLowerCase().replace(/\s/g, "")}`, avatar: user.name.slice(0, 2).toUpperCase(), verified: false, followerCount: 0 },
      saved: false, attendees: 0, likes: 0, friendsGoing: [], createdAt: new Date().toISOString(), createdByUserId: user.id,
    };
    await pool.query("INSERT INTO api_events(id,created_by,starts_at,payload) VALUES ($1,$2,$3,$4)", [id, user.id, startsAt, event]);
    res.status(201).json(event);
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
    if (error instanceof SyntaxError) return void res.status(400).json({ error: "Invalid JSON." });
    console.error("API operation failed", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Unable to complete this request. Try again." });
  };
  app.use(errors);
  return app;
};
