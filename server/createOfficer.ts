import { randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { authFormSchema } from "../shared/forms";
import { createPool, migrate } from "./database";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const input = authFormSchema("signup").parse({
  email: process.env.OFFICER_EMAIL, name: process.env.OFFICER_NAME, password: process.env.OFFICER_PASSWORD,
});
const pool = createPool(process.env.DATABASE_URL);
try {
  await migrate(pool);
  await pool.query(
    `INSERT INTO api_users(id,email,password_hash,name,role) VALUES($1,$2,$3,$4,'org_officer')
     ON CONFLICT(email) DO UPDATE SET role='org_officer'`,
    [randomUUID(), input.email.toLowerCase(), await hash(input.password), input.name],
  );
  console.log("Officer account provisioned. Existing accounts keep their password.");
} finally { await pool.end(); }
