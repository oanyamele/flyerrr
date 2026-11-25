import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { listMigrations, migrate } from "./database";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required. Use a local test database.");
// Own schema per run, like api.test.ts, so parallel test files cannot collide.
const schema = `migrate_test_${randomUUID().replaceAll("-", "")}`;
const admin = new Pool({ connectionString: databaseUrl });
const pool = new Pool({ connectionString: databaseUrl, options: `-c search_path=${schema}` });

describe("migration runner", () => {
  before(async () => {
    await admin.query(`CREATE SCHEMA ${schema}`);
  });
  after(async () => {
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });

  it("applies every migration once and records its checksum", async () => {
    const expected = (await listMigrations()).map((migration) => migration.name);
    assert.ok(expected.length > 0);
    assert.deepEqual(await migrate(pool), expected);

    const { rows } = await pool.query<{ name: string; checksum: string }>("SELECT name, checksum FROM schema_migrations ORDER BY name");
    assert.deepEqual(rows.map((row) => row.name), expected);
    assert.ok(rows.every((row) => /^[0-9a-f]{64}$/.test(row.checksum)));
    const table = await pool.query("SELECT to_regclass('api_users') AS found");
    assert.notEqual(table.rows[0].found, null);
  });

  it("does nothing when run again", async () => {
    assert.deepEqual(await migrate(pool), []);
  });

  it("refuses to continue when an applied migration was modified", async () => {
    const [first] = await listMigrations();
    await pool.query("UPDATE schema_migrations SET checksum = 'tampered' WHERE name = $1", [first.name]);
    await assert.rejects(migrate(pool), /was modified after it was applied/);
    await pool.query("UPDATE schema_migrations SET checksum = $1 WHERE name = $2", [first.checksum, first.name]);
    assert.deepEqual(await migrate(pool), []);
  });
});
