import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { Pool } from "pg";

export const createPool = (connectionString: string) => new Pool({ connectionString });

const MIGRATIONS_DIR = new URL("./migrations/", import.meta.url);
// Arbitrary constant. A session-level advisory lock serializes migrators that start
// at the same time, for example two API instances booting during a deploy.
const MIGRATION_LOCK_ID = 7_260_014;

// Line endings are normalized so a Windows checkout cannot change a checksum.
const checksum = (sql: string) => createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");

export interface Migration {
  name: string;
  sql: string;
  checksum: string;
}

/** Migration files are NNN_description.sql in server/migrations, applied in name order. */
export const listMigrations = async (): Promise<Migration[]> => {
  const names = (await readdir(MIGRATIONS_DIR)).filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name)).sort();
  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(new URL(name, MIGRATIONS_DIR), "utf8");
      return { name, sql, checksum: checksum(sql) };
    }),
  );
};

/**
 * Applies every migration that has not been recorded in schema_migrations and returns
 * the names it applied. Running it again is a no-op.
 *
 * Rules for migration files:
 * - Never edit a migration after it has been applied anywhere. The checksum guard
 *   fails loudly if you do; add a new numbered file instead.
 * - Each file manages its own transaction (BEGIN ... COMMIT) and should be safe to
 *   re-run, because a crash between the file and its record would run it again.
 */
export const migrate = async (pool: Pool): Promise<string[]> => {
  const migrations = await listMigrations();
  const client = await pool.connect();
  const applied: string[] = [];
  let healthy = true;
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`,
    );
    const { rows } = await client.query<{ name: string; checksum: string }>("SELECT name, checksum FROM schema_migrations");
    const recorded = new Map(rows.map((row) => [row.name, row.checksum]));
    for (const migration of migrations) {
      const existing = recorded.get(migration.name);
      if (existing !== undefined) {
        if (existing !== migration.checksum) {
          throw new Error(`Migration ${migration.name} was modified after it was applied. Add a new migration instead of editing an applied one.`);
        }
        continue;
      }
      await client.query(migration.sql);
      await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [migration.name, migration.checksum]);
      applied.push(migration.name);
    }
    return applied;
  } catch (error) {
    healthy = false;
    throw error;
  } finally {
    try {
      if (healthy) await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    } finally {
      // After a failure the connection may be mid-transaction, so destroy it instead of
      // returning it to the pool. Closing it also releases the advisory lock.
      client.release(!healthy);
    }
  }
};
