import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/bookmarks",
  globalSetup: "./e2e/bookmarks/setup.ts",
  workers: 1,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:4181", browserName: "chromium", channel: process.env.PLAYWRIGHT_CHANNEL, timezoneId: "UTC", trace: "retain-on-failure" },
  webServer: {
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4181 --strictPort",
    url: "http://127.0.0.1:4181",
    env: { VITE_DATA_BACKEND: "http", API_PROXY_TARGET: "http://127.0.0.1:3101" },
    reuseExistingServer: false,
  },
});
