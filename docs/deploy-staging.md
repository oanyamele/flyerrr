# Staging deployment

Staging runs the same code as local development:

- **Database:** a Supabase project, used only as managed PostgreSQL.
- **API and web app:** one Render web service built from the `Dockerfile`. The API serves
  the built web app too, so both share one address. That keeps the session cookie and the
  `Origin` check working without any cross-origin setup.

The API applies pending migrations every time it starts (see the migrations section of
[bookmarks-backend.md](./bookmarks-backend.md)), so deploying a new version updates the
database too.

Nothing here has been deployed by the person who wrote it. The first deploy is the real
test, so expect to fix small things.

## 1. Create the Supabase project

1. Sign in at supabase.com and create a project named `flyerrr-staging`. Choose a region near
   your users and save the database password in your password manager.
2. Open **Connect** (top of the project page) and copy the **Session pooler** connection string.
   Use the session pooler, not the "direct connection" (it needs IPv6, which Render may not
   have) and not the "transaction pooler" (the migration runner needs a session-level lock).
   It looks like `postgres://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`.
   Put your real password in place of `[YOUR-PASSWORD]`.
3. Open **Project Settings, Database, SSL Configuration** and download the certificate.
   Open it in a text editor. It starts with `-----BEGIN CERTIFICATE-----`.

Do not add `?sslmode=...` to the connection string. The certificate turns on verified TLS by
itself, and the server refuses to start if both are present.

Migration `004_lock_down_tables.sql` turns on row level security for every table, so
Supabase's built-in data API cannot read them with the public key. Do not add policies for
`anon` or `authenticated` to these tables. After the first deploy, check **Table Editor**: each
`api_*` table should show RLS enabled.

## 2. Create the Render service

1. Sign in at render.com and connect your GitHub account to the `flyerrr` repository.
2. Choose **New, Blueprint**, pick the repository and the `main` branch. Render reads `render.yaml`.
3. When it asks for values, enter:
   - `DATABASE_URL`: the session pooler string from step 1.
   - `DATABASE_SSL_CA`: the whole certificate, including the BEGIN and END lines.
   - `APP_ORIGIN`: the service's public address, such as `https://flyerrr-staging.onrender.com`.
     The service name decides the address. If Render shows a different one after creation,
     change `APP_ORIGIN` to match and redeploy. A mismatch makes every sign-in return 403.
4. Create the service and wait for the first build, which takes several minutes. The service
   is healthy when `https://<your-address>/api/health` returns `{"ok":true}`.

The free plan sleeps after a period without traffic, and the first request afterwards is slow.
That is fine for staging.

## 3. Create the first officer

Registration only creates students. Officers are created from your own computer against the
staging database, once the first deploy has created the tables:

```sh
DATABASE_URL='<the session pooler string>' \
DATABASE_SSL_CA="$(cat ~/Downloads/<the certificate file>)" \
OFFICER_EMAIL=you@howard.edu OFFICER_NAME='Your Name' OFFICER_PASSWORD='ChooseAnOriginalPassword123' \
npx tsx server/createOfficer.ts
```

Then sign in on the staging address, publish an event, and check it from another browser.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Deploy fails at the health check | Wrong `DATABASE_URL` or certificate. Read the service logs. |
| Log says `self-signed certificate in certificate chain` | `DATABASE_SSL_CA` is missing or incomplete. |
| Log says to remove `sslmode` | Delete `?sslmode=...` from `DATABASE_URL`. |
| Every sign-in or save returns 403 | `APP_ORIGIN` does not match the address in the browser, exactly, with `https://` and no trailing slash. |
| Page loads but shows demo data | The web app was built without `VITE_DATA_BACKEND=http`. The `Dockerfile` sets it, so this means the image was built another way. |

## What to do about secrets

`DATABASE_URL` and the certificate live only in the Render dashboard. Do not paste them into
chat, issues or pull requests. If one leaks, reset the database password in Supabase and update
`DATABASE_URL` in Render.
