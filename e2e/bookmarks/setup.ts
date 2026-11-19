import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { hash } from "@node-rs/argon2";
import { createApi } from "../../server/app";
import { migrate } from "../../server/database";

export default async function setup() {
  if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is required.");
  const schema = `browser_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` });
  await migrate(pool);
  await pool.query("INSERT INTO api_users(id,email,password_hash,name,role) VALUES($1,$2,$3,$4,'org_officer')", [randomUUID(), "officer@howard.edu", await hash("GoodPassword123"), "Test Officer"]);
  const app = await createApi(pool, { origin: "http://127.0.0.1:4181", secureCookies: false });
  const server = app.listen(3101, "127.0.0.1");
  await new Promise<void>((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  return async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  };
}
