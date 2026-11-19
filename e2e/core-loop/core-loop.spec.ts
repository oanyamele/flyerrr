/**
 * F3.4 (#24): end-to-end core loop against the real API and PostgreSQL.
 * Runs in CI with the shared browser-test setup (e2e/bookmarks/setup.ts).
 *
 * Steps that depend on unfinished backend work are declared with test.fixme,
 * so they show up as skipped in the report and point at the blocking issue.
 */
import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "GoodPassword123";
const EVENT_TITLE = "Core Loop Mixer";

/** Signs in or signs up. Works with or without the old Student/Officer picker. */
const signIn = async (page: Page, email: string, signup = false) => {
  await page.goto("/login");
  const picker = page.getByRole("button", { name: "Student Discover" });
  const emailBox = page.getByRole("textbox", { name: "University Email" });
  await picker.or(emailBox).first().waitFor();
  if (await picker.isVisible()) await picker.click();
  if (signup) {
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await page.getByRole("textbox", { name: "Full Name" }).fill("Core Loop Student");
  }
  await emailBox.fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: signup ? "Create Account" : "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
};

const signOut = async (page: Page) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page).toHaveURL(/\/login$/);
};

test("officer publishes an event; a new student signs up, signs in again, and finds it in the feed", async ({ browser }) => {
  const officerContext = await browser.newContext();
  const studentContext = await browser.newContext();
  const officer = await officerContext.newPage();
  const student = await studentContext.newPage();

  // Officer creates an event.
  await signIn(officer, "officer@howard.edu");
  await officer.goto("/create-event");
  await officer.getByPlaceholder("e.g. Fall Career Fair").fill(EVENT_TITLE);
  await officer.getByPlaceholder("Tell students what to expect...").fill("Meet other students at the core loop mixer.");
  await officer.getByLabel("Date", { exact: true }).fill(new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10));
  await officer.getByLabel("Time", { exact: true }).fill("18:00");
  await officer.getByPlaceholder("e.g. Student Center Ballroom").fill("Blackburn Center");
  await officer.getByRole("button", { name: "Publish Event" }).click();
  await expect(officer).toHaveURL(/\/$/);

  // A brand-new student signs up and lands on the feed, which shows the event.
  await signIn(student, "core.loop@howard.edu", true);
  await expect(student.getByRole("link", { name: new RegExp(`View ${EVENT_TITLE}`) }).first()).toBeVisible();

  // Signing out and back in keeps working, and the feed still shows the event.
  await signOut(student);
  await signIn(student, "core.loop@howard.edu");
  await student.getByRole("link", { name: new RegExp(`View ${EVENT_TITLE}`) }).first().click();
  await expect(student.getByRole("heading", { name: EVENT_TITLE })).toBeVisible();

  await officerContext.close();
  await studentContext.close();
});

test.fixme("student RSVPs and sees the event in reminders", async () => {
  // Blocked: RSVPs and reminders are still stored in the browser and read the
  // local event list, so an event published through the API never appears in
  // Reminders. Needs RSVPs/reminders on the server.
});

test.fixme("two browsers: student presents a check-in code and the officer validates it", async () => {
  // Blocked by #18: check-in codes are stored in the student's browser, so an
  // officer on another device can't validate them. Needs server-issued tokens.
});

test.fixme("student's points and attendance history update after check-in", async () => {
  // Blocked by #19: a validated check-in doesn't save an attendance record yet,
  // so there are no points or history to check.
});
