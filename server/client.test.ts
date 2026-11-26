import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import express from "express";
import { serveClient } from "./client";

describe("serving the built web app", () => {
  let directory: string;
  let server: Server;
  let base: string;
  before(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "flyerrr-client-"));
    await mkdir(path.join(directory, "assets"));
    await writeFile(path.join(directory, "index.html"), "<html>flyerrr-shell</html>");
    await writeFile(path.join(directory, "assets", "app.js"), "console.log('app');");
    const app = express();
    app.get("/api/health", (_req, res) => { res.json({ ok: true }); });
    assert.equal(serveClient(app, directory), true);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No server address");
    base = `http://127.0.0.1:${address.port}`;
  });
  after(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  });

  it("serves the app shell for the root and for client-side routes", async () => {
    for (const route of ["/", "/explore", "/events/123/check-in"]) {
      const res = await fetch(`${base}${route}`);
      assert.equal(res.status, 200, route);
      assert.match(await res.text(), /flyerrr-shell/, route);
    }
  });

  it("serves built files as they are, and 404s a missing file instead of returning the shell", async () => {
    const found = await fetch(`${base}/assets/app.js`);
    assert.equal(found.status, 200);
    assert.match(await found.text(), /console\.log/);
    assert.equal((await fetch(`${base}/assets/missing.js`)).status, 404);
  });

  it("leaves /api alone and only rewrites reads", async () => {
    assert.deepEqual(await (await fetch(`${base}/api/health`)).json(), { ok: true });
    const unknown = await fetch(`${base}/api/unknown`);
    assert.equal(unknown.status, 404);
    assert.doesNotMatch(await unknown.text(), /flyerrr-shell/);
    assert.equal((await fetch(`${base}/explore`, { method: "POST" })).status, 404);
  });

  it("serves nothing when the web app has not been built", async () => {
    assert.equal(serveClient(express(), path.join(directory, "does-not-exist")), false);
  });
});
