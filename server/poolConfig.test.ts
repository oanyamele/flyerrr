import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { poolConfig } from "./poolConfig";

describe("database pool settings", () => {
  const url = "postgres://user:pw@db.example.com:5432/postgres";

  it("uses only the URL when no certificate is configured", () => {
    assert.deepEqual(poolConfig(url, {}), { connectionString: url });
    assert.deepEqual(poolConfig(`${url}?sslmode=require`, { DATABASE_SSL_CA: "  " }), { connectionString: `${url}?sslmode=require` });
  });

  it("verifies the server against the configured certificate authority", () => {
    const pem = "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----";
    assert.deepEqual(poolConfig(url, { DATABASE_SSL_CA: `${pem}\n` }), { connectionString: url, ssl: { ca: pem } });
  });

  it("refuses a URL whose sslmode would override the certificate", () => {
    assert.throws(() => poolConfig(`${url}?sslmode=require`, { DATABASE_SSL_CA: "pem" }), /Remove sslmode/);
    assert.throws(() => poolConfig(`${url}?application_name=x&sslmode=disable`, { DATABASE_SSL_CA: "pem" }), /Remove sslmode/);
  });
});
