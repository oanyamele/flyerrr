import { fileURLToPath } from "node:url";
import { createApi } from "./app";
import { serveClient } from "./client";
import { createPool, migrate } from "./database";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const origin = process.env.APP_ORIGIN ?? "http://localhost:8080";
const production = process.env.NODE_ENV === "production";
if (production && !origin.startsWith("https://")) throw new Error("Production APP_ORIGIN must use HTTPS.");
const pool = createPool(process.env.DATABASE_URL);
await migrate(pool);
const app = await createApi(pool, { origin, secureCookies: production });
// In a deployment the API also serves the built web app, so both share one origin.
if (serveClient(app, process.env.CLIENT_DIR ?? fileURLToPath(new URL("../dist/", import.meta.url)))) console.log("Serving the web app");
const server = app.listen(Number(process.env.PORT ?? 3001), process.env.API_HOST ?? "127.0.0.1", () => console.log("Flyerrr API ready"));
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => {
  server.close(() => { void pool.end().then(() => process.exit(0)); });
});
