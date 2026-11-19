import { expect, test, type Page } from "@playwright/test";

const login = async (page: Page, email: string, signup = false) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Student Discover" }).click();
  if (signup) {
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await page.getByRole("textbox", { name: "Full Name" }).fill("Test Student");
  }
  await page.getByRole("textbox", { name: "University Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("GoodPassword123");
  await page.getByRole("button", { name: signup ? "Create Account" : "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
};

test("officer publish, live search, save/reload/unsave, and account isolation", async ({ browser }) => {
  const officerContext = await browser.newContext();
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const officer = await officerContext.newPage();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();
  await login(officer, "officer@howard.edu");
  await login(alice, "alice@howard.edu", true);
  await login(bob, "bob@howard.edu", true);
  await officer.goto("/create-event");
  await officer.getByPlaceholder("e.g. Fall Career Fair").fill("Bookmark Integration Showcase");
  await officer.getByPlaceholder("Tell students what to expect...").fill("Meet the team at our integration showcase.");
  await officer.getByLabel("Date", { exact: true }).fill(new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10));
  await officer.getByLabel("Time", { exact: true }).fill("12:00");
  await officer.getByPlaceholder("e.g. Student Center Ballroom").fill("Campus Center");
  await officer.getByRole("button", { name: "Publish Event" }).click();
  await expect(officer).toHaveURL(/\/$/);
  await alice.goto("/explore");
  await alice.getByRole("searchbox").fill("Bookmark Integration");
  await alice.getByRole("button", { name: /Bookmark Integration Showcase/ }).click();
  await expect(alice.getByRole("heading", { name: "Bookmark Integration Showcase" })).toBeVisible();
  await alice.getByRole("button", { name: "Save event", exact: true }).click();
  await expect(alice.getByRole("button", { name: "Unsave event" })).toHaveAttribute("aria-pressed", "true");
  await alice.reload();
  await expect(alice.getByRole("button", { name: "Unsave event" })).toBeVisible();
  await alice.goto("/saved");
  await expect(alice.getByRole("button", { name: /Bookmark Integration Showcase/ })).toBeVisible();
  await bob.goto("/saved");
  await expect(bob.getByText("No saved events yet")).toBeVisible();
  await alice.goto("/profile");
  await alice.getByRole("button", { name: "Sign Out" }).click();
  await expect(alice).toHaveURL(/\/login$/);
  await alice.evaluate(() => localStorage.setItem("flyerrr_auth_v1", JSON.stringify({ isLoggedIn: true, userId: "forged-officer", role: "org_officer", userName: "Forged" })));
  await alice.goto("/create-event");
  await expect(alice).toHaveURL(/\/login$/);
  // Same browser, different account: neither cached nor stored saves may leak.
  await login(alice, "bob@howard.edu");
  await alice.goto("/saved");
  await expect(alice.getByText("No saved events yet")).toBeVisible();
  await alice.goto("/profile");
  await alice.getByRole("button", { name: "Sign Out" }).click();
  await login(alice, "alice@howard.edu");
  await alice.goto("/saved");
  await alice.getByRole("button", { name: "Unsave event" }).click();
  await expect(alice.getByText("No saved events yet")).toBeVisible();
  await alice.reload();
  await expect(alice.getByText("No saved events yet")).toBeVisible();
  await officerContext.close(); await aliceContext.close(); await bobContext.close();
});

test("a failed save stays unsaved and can be retried", async ({ page, request }) => {
  const headers = { Origin: "http://127.0.0.1:4181" };
  await request.post("/api/auth/login", { headers, data: { email: "officer@howard.edu", password: "GoodPassword123" } });
  const date = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const created = await request.post("/api/events", { headers, data: { title: "Retry Showcase", description: "A showcase to test failed saves.", category: "social", date, time: "12:00", startsAt: `${date}T12:00:00Z`, timezone: "UTC", location: "Campus Center", capacity: 10, tags: [], image: "/placeholder.svg" } });
  expect(created.status()).toBe(201);
  await login(page, "retry@howard.edu", true);
  await page.getByRole("link", { name: /View Retry Showcase/ }).click();
  await page.route("**/api/bookmarks/*", async route => {
    if (route.request().method() === "PUT") await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Please retry." }) });
    else await route.continue();
  });
  const save = page.getByRole("button", { name: "Save event", exact: true });
  await save.click();
  await expect(page.getByText("Couldn't update saved events", { exact: true })).toBeVisible();
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await page.unroute("**/api/bookmarks/*");
  await save.click();
  await expect(page.getByRole("button", { name: "Unsave event" })).toHaveAttribute("aria-pressed", "true");
});
