import type { PoolConfig } from "pg";

/**
 * Connection settings for the database pool. Local and CI databases need only the URL.
 * A hosted database that requires TLS with its own certificate authority, such as Supabase,
 * sets DATABASE_SSL_CA to that authority's PEM certificate, and the connection then verifies
 * the server. The URL must not also carry `sslmode`, because the pg driver lets the URL
 * override these settings and would silently drop the certificate.
 */
export const poolConfig = (connectionString: string, env: Record<string, string | undefined> = process.env): PoolConfig => {
  const ca = env.DATABASE_SSL_CA?.trim();
  if (!ca) return { connectionString };
  if (/[?&]sslmode=/i.test(connectionString)) {
    throw new Error("Remove sslmode from DATABASE_URL when DATABASE_SSL_CA is set. The certificate already turns on verified TLS.");
  }
  return { connectionString, ssl: { ca } };
};
