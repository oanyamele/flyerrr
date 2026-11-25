// `npx playwright test` uses this file by default. The only E2E suite today is
// the bookmarks suite, so reuse its standard config rather than keeping a second
// one in sync. Add shared overrides here if more suites appear.
import bookmarksConfig from "./playwright.bookmarks.config";

export default bookmarksConfig;
