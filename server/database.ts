import { readFile } from "node:fs/promises";
import { Pool } from "pg";

export const createPool = (connectionString: string) => new Pool({ connectionString });

export const migrate = async (pool: Pool) => {
  // One idempotent, additive migration for the bookmark vertical slice. The api_
  // namespace avoids colliding with the team's proposed full relational schema.
  const sql = await readFile(new URL("./migrations/001_bookmarks.sql", import.meta.url), "utf8");
  await pool.query(sql);
};
