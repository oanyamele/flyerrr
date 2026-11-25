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

describe("organizations migration on a database that already has events", () => {
  const upgradeSchema = `migrate_upgrade_${randomUUID().replaceAll("-", "")}`;
  const upgrade = new Pool({ connectionString: databaseUrl, options: `-c search_path=${upgradeSchema}` });
  before(async () => {
    await admin.query(`CREATE SCHEMA ${upgradeSchema}`);
  });
  after(async () => {
    await upgrade.end();
    await admin.query(`DROP SCHEMA ${upgradeSchema} CASCADE`);
  });

  it("gives each existing event creator one organization that they lead", async () => {
    // Build the database as it was before organizations: migrations 001 and 002 only.
    const all = await listMigrations();
    const before003 = all.filter((migration) => migration.name < "003");
    await upgrade.query("CREATE TABLE schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    for (const migration of before003) {
      await upgrade.query(migration.sql);
      await upgrade.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [migration.name, migration.checksum]);
    }
    const [first, second] = [randomUUID(), randomUUID()];
    for (const [id, email, name] of [[first, "one@howard.edu", "Ada Lovelace"], [second, "two@howard.edu", "!!"]]) {
      await upgrade.query("INSERT INTO api_users(id,email,password_hash,name,role) VALUES ($1,$2,'x',$3,'org_officer')", [id, email, name]);
    }
    for (const [creator, title] of [[first, "A"], [first, "B"], [second, "C"]]) {
      await upgrade.query("INSERT INTO api_events(id,created_by,starts_at,payload) VALUES ($1,$2,now() + interval '1 day',$3)", [randomUUID(), creator, JSON.stringify({ title })]);
    }

    assert.deepEqual(await migrate(upgrade), ["003_organizations.sql"]);

    const orgs = await upgrade.query<{ created_by: string; handle: string; name: string; events: string; role: string }>(
      `SELECT o.created_by, o.handle, o.name, m.role,
              (SELECT count(*) FROM api_events e WHERE e.organization_id = o.id) AS events
       FROM api_organizations o JOIN api_organization_members m ON m.organization_id = o.id AND m.user_id = o.created_by
       ORDER BY o.name`,
    );
    assert.equal(orgs.rowCount, 2);
    const byCreator = new Map(orgs.rows.map((row) => [row.created_by, row]));
    assert.equal(byCreator.get(first)?.events, "2");
    assert.equal(byCreator.get(first)?.name, "Ada Lovelace Org");
    assert.match(byCreator.get(first)!.handle, /^adalovelace_[0-9a-f]{6}$/);
    assert.equal(byCreator.get(second)?.events, "1");
    assert.match(byCreator.get(second)!.handle, /^org_[0-9a-f]{6}$/);
    assert.ok(orgs.rows.every((row) => row.role === "leader"));
    const orphans = await upgrade.query("SELECT count(*) FROM api_events WHERE organization_id IS NULL");
    assert.equal(orphans.rows[0].count, "0");
  });
});
