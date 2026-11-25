import { createPool, migrate } from "./database";

// Usage: DATABASE_URL=postgres://... bun run api:migrate
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = createPool(process.env.DATABASE_URL);
try {
  const applied = await migrate(pool);
  console.log(applied.length > 0 ? `Applied migrations: ${applied.join(", ")}` : "Database is up to date.");
} finally {
  await pool.end();
}
