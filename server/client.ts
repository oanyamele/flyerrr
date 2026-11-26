import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";

/**
 * Serves the built web app (the Vite `dist` folder) from the same origin as the API, so
 * the session cookie and the Origin check work without any cross-origin setup. Unknown page
 * paths get index.html so client-side routes survive a reload. Paths under /api and paths
 * that look like files are never rewritten. Returns false, and serves nothing, when the web
 * app has not been built, which is the normal state during development.
 */
export const serveClient = (app: Express, directory: string) => {
  const root = path.resolve(directory);
  const index = path.join(root, "index.html");
  if (!existsSync(index)) return false;
  app.use(express.static(root, { index: false }));
  app.use((req, res, next) => {
    const isPage = (req.method === "GET" || req.method === "HEAD") && !/^\/api(\/|$)/.test(req.path) && !path.extname(req.path);
    if (!isPage) return next();
    res.sendFile(index);
  });
  return true;
};
