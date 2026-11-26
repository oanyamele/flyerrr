import { expect, test, type Page } from "@playwright/test";

const login = async (page: Page, email: string, signup = false) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Student Discover" }).click();
  if (signup) {
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await page.getByRole("textbox", { name: "Full Name" }).fill("Maya Student");
  }
  await page.getByRole("textbox", { name: "University Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("GoodPassword123");
  await page.getByRole("button", { name: signup ? "Create Account" : "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
};

// Two browser contexts are two separate devices: they share nothing but the server.
test("a student on one device is checked in by an officer on another, once", async ({ browser }) => {
  const officerContext = await browser.newContext();
  const studentContext = await browser.newContext();
  const officer = await officerContext.newPage();
  const student = await studentContext.newPage();
  await login(officer, "officer@howard.edu");
  await login(student, "maya@bison.howard.edu", true);

  await officer.goto("/create-event");
  await officer.getByPlaceholder("e.g. Fall Career Fair").fill("Cross-Device Check-In");
  await officer.getByPlaceholder("Tell students what to expect...").fill("A showcase to prove check-in works across devices.");
  await officer.getByLabel("Date", { exact: true }).fill(new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10));
  await officer.getByLabel("Time", { exact: true }).fill("12:00");
  await officer.getByPlaceholder("e.g. Student Center Ballroom").fill("Campus Center");
  await officer.getByRole("button", { name: "Publish Event" }).click();
  await expect(officer).toHaveURL(/\/$/);

  // The student's device asks the server for a code.
  await student.goto("/tap-in");
  await student.getByLabel("Select event for check-in").selectOption({ label: "Cross-Device Check-In" });
  await student.getByRole("button", { name: "Show My Check-In QR" }).click();
  const shown = student.getByTestId("check-in-code");
  await expect(shown).not.toHaveText("Generating code…");
  const code = (await shown.innerText()).trim();
  expect(code).toMatch(/^[\w-]+\.[\w-]+$/);

  // The officer's device submits it.
  await officer.goto("/tap-in");
  await officer.getByLabel("Select event to validate").selectOption({ label: "Cross-Device Check-In" });
  const payload = officer.getByLabel("Scanned QR payload");
  const validate = officer.getByRole("button", { name: "Validate Attendance" });

  // A code with its signature altered is refused and does not use the real code up.
  await payload.fill(`${code.slice(0, -4)}${code.endsWith("AAAA") ? "BBBB" : "AAAA"}`);
  await validate.click();
  await expect(officer.getByText("This is not a valid check-in code.").first()).toBeVisible();

  await payload.fill(code);
  await validate.click();
  await expect(officer.getByText(/Maya Student checked in for Cross-Device Check-In/).first()).toBeVisible();
  await expect(officer.getByRole("list", { name: "Checked-in attendees" })).toContainText("Maya Student");

  // Showing the same code again does not check anyone in a second time.
  await payload.fill(code);
  await validate.click();
  await expect(officer.getByText("This code was already used.").first()).toBeVisible();
  await expect(officer.getByRole("list", { name: "Checked-in attendees" }).getByRole("listitem")).toHaveCount(1);

  // The record is on the server: a fresh page load still shows it.
  await officer.reload();
  await officer.getByLabel("Select event to validate").selectOption({ label: "Cross-Device Check-In" });
  await expect(officer.getByRole("list", { name: "Checked-in attendees" })).toContainText("Maya Student");

  // A student cannot check anyone in, even with a real code: the server refuses them.
  const events = (await (await studentContext.request.get("/api/events")).json()) as { id: string; title: string }[];
  const eventId = events.find((item) => item.title === "Cross-Device Check-In")?.id;
  expect(eventId).toBeTruthy();
  const selfCheckIn = await studentContext.request.post(`/api/events/${eventId}/check-ins`, { headers: { Origin: "http://127.0.0.1:4181" }, data: { token: code } });
  expect(selfCheckIn.status()).toBe(403);

  await officerContext.close();
  await studentContext.close();
});
