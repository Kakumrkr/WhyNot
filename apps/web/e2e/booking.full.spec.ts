import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  BookingResponseSchema,
  PolicyListResponseSchema,
  demoPatientHeader,
  demoRoleHeader,
} from "@whynot/contracts/api";

const scope = "/api/demo/H3";
const staff = { [demoRoleHeader]: "staff" };
const patient = { [demoRoleHeader]: "patient", [demoPatientHeader]: "patient-0" };
const request = {
  patientId: "patient-0",
  serviceId: "consult",
  practitionerId: "rao",
  start: "2026-11-16T11:00:00Z",
};

function bookingPanel(page: Page) {
  return page.getByRole("region", { name: "Demo bookings" });
}

async function selectOpening(page: Page) {
  await page.goto("/?scenarioId=H3&practitionerId=rao");
  await page.getByText("Choose a start", { exact: true }).click();
  await page.getByRole("button", { name: "11:00 Available", exact: true }).click();
  return bookingPanel(page).getByRole("button", { name: "Book appointment" });
}

test("commits only after confirmation and cancels the saved booking", async ({
  page,
}, testInfo) => {
  const book = await selectOpening(page);
  await book.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Confirm this appointment?" });
  await expect(dialog.getByRole("button", { name: "Go back" })).toBeFocused();
  await expect(dialog).toHaveAccessibleDescription(/11:00.*Dr\. Asha Rao/);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual(
    [],
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    testInfo.project.use.viewport?.width,
  );
  await page.screenshot({ path: testInfo.outputPath("booking-confirmation.png") });
  await page.keyboard.press("Escape");
  await expect(book).toBeFocused();
  await expect(bookingPanel(page).getByText("Appointment confirmed")).toHaveCount(0);
  await book.click();
  const confirmed = page.waitForResponse(
    (response) =>
      response.url().endsWith(`${scope}/bookings`) && response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Confirm booking" }).click();
  const response = await confirmed;
  expect(response.status()).toBe(201);
  const { id } = BookingResponseSchema.parse(await response.json());
  try {
    await expect(bookingPanel(page).getByText("Appointment confirmed")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Requested appointment" }).getByRole("status"),
    ).toHaveText("This appointment is confirmed");
    await expect(
      page.getByRole("button", { name: "11:00 Unavailable", exact: true }),
    ).toBeVisible();
    await expect(
      bookingPanel(page).getByRole("button", { name: "Cancel appointment" }),
    ).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath("booking-receipt.png"), fullPage: true });
    await bookingPanel(page).getByRole("button", { name: "Cancel appointment" }).click();
    const cancel = page.getByRole("dialog", { name: "Cancel this appointment?" });
    await expect(cancel.getByRole("button", { name: "Go back" })).toBeFocused();
    await cancel.getByRole("button", { name: "Confirm cancellation" }).click();
    await expect(bookingPanel(page).getByRole("status")).toHaveText("Appointment cancelled.");
    await expect(bookingPanel(page).getByText("Appointment confirmed")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "11:00 Available", exact: true })).toBeVisible();
  } finally {
    // Cancellation is idempotent. Release the slot even if an assertion failed.
    expect((await page.request.delete(`${scope}/bookings/${id}`, { headers: patient })).ok()).toBe(
      true,
    );
  }
});

test("replaces a stale bookable result with the projected 409 explanation", async ({
  page,
}, testInfo) => {
  const book = await selectOpening(page);
  await book.click();
  const competing = await page.request.post(`${scope}/bookings`, {
    headers: patient,
    data: request,
  });
  expect(competing.status()).toBe(201);
  const { id } = BookingResponseSchema.parse(await competing.json());
  try {
    const conflictResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`${scope}/bookings`) && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Confirm booking" }).click();
    expect((await conflictResponse).status()).toBe(409);
    await expect(bookingPanel(page).getByRole("status")).toContainText(
      "Review the updated explanation above",
    );
    const explanation = page.getByRole("region", { name: "Why this time is unavailable" });
    await expect(explanation).toBeVisible();
    await expect(
      explanation.getByRole("listitem").filter({
        hasText: "You already have the maximum of 1 appointment that day.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "11:00 Unavailable", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/just taken/i)).toHaveCount(0);
    await expect(bookingPanel(page).getByText("Appointment confirmed")).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("booking-conflict.png"), fullPage: true });
  } finally {
    expect((await page.request.delete(`${scope}/bookings/${id}`, { headers: patient })).ok()).toBe(
      true,
    );
  }
});

test("rechecks a receipt after another client resets its scope", async ({ page }) => {
  const book = await selectOpening(page);
  const confirmed = page.waitForResponse(
    (response) =>
      response.url().endsWith(`${scope}/bookings`) && response.request().method() === "POST",
  );
  const rechecked = page.waitForResponse(
    (response) =>
      response.url().includes(`${scope}/bookings/`) && response.request().method() === "GET",
  );
  await book.click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  const stored = await confirmed;
  expect(stored.status()).toBe(201);
  const { id } = BookingResponseSchema.parse(await stored.json());
  let reset = false;
  try {
    expect((await rechecked).status()).toBe(200);
    await expect(bookingPanel(page).getByText("Appointment confirmed")).toBeVisible();
    const resetResponse = await page.request.post(`${scope}/demo/reset`, { headers: staff });
    expect(resetResponse.status()).toBe(200);
    reset = true;
    const expired = page.waitForResponse(
      (response) =>
        response.url().endsWith(`${scope}/bookings/${id}`) && response.request().method() === "GET",
    );
    await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
    expect((await expired).status()).toBe(404);
    await expect(bookingPanel(page).getByText("Appointment confirmed")).toHaveCount(0);
    await expect(book).toBeEnabled();
    await expect(page.getByRole("button", { name: "11:00 Available", exact: true })).toBeVisible();
  } finally {
    if (!reset) {
      expect(
        (await page.request.delete(`${scope}/bookings/${id}`, { headers: patient })).ok(),
      ).toBe(true);
    }
  }
});

test("rejects an invalid success response without displaying a booking receipt", async ({
  page,
}) => {
  const book = await selectOpening(page);
  await page.route(`**${scope}/bookings`, (route) =>
    route.fulfill({ status: 201, json: { id: "incomplete-receipt" } }),
  );
  await book.click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(bookingPanel(page).getByRole("status")).toContainText("could not confirm");
  await expect(bookingPanel(page).getByText("Appointment confirmed")).toHaveCount(0);
  await expect(page.getByText(/just taken|incomplete-receipt/)).toHaveCount(0);
});

test("rejects a patient response containing staff-only fields", async ({ page }) => {
  await page.route(`**${scope}/explain`, async (route) => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    const json: Record<string, unknown> = await response.json();
    await route.fulfill({ response, json: { ...json, trace: "staff-only-evidence" } });
  });
  await page.goto("/?scenarioId=H3");
  await expect(page.getByRole("heading", { name: "Appointment check failed" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Verified alternatives" })).toHaveCount(0);
  await expect(page.getByText("staff-only-evidence")).toHaveCount(0);
});

test("previews staff policy on the server without changing the active version", async ({
  page,
}, testInfo) => {
  await page.goto("/?scenarioId=H3&audience=staff");
  const readPolicy = async () =>
    PolicyListResponseSchema.parse(
      await (await page.request.get(`${scope}/admin/policies`, { headers: staff })).json(),
    );
  const saved = await readPolicy();
  const panel = page.getByRole("region", { name: "Policy playground" });
  await panel.getByText("Explore policy changes").click();
  await panel.getByLabel("Setting to preview").selectOption("suggested");
  await panel.getByRole("button", { name: "Preview change" }).click();
  await expect(panel.getByText("120 → 60", { exact: true })).toBeVisible();
  await expect(panel.getByText("This appointment can be booked.", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Requested appointment" }).getByRole("status"),
  ).toHaveText("This appointment is unavailable at the requested time.");
  expect(await readPolicy()).toEqual(saved);
  await page.screenshot({ path: testInfo.outputPath("policy-preview.png"), fullPage: true });
});

test("staff reset restores a curated scope and preserves base policy", async ({ page }) => {
  await page.goto("/?scenarioId=H3&audience=staff");
  const readPolicy = async (prefix: string) =>
    PolicyListResponseSchema.parse(
      await (await page.request.get(`${prefix}/admin/policies`, { headers: staff })).json(),
    );
  const [base, curated] = await Promise.all([readPolicy("/api"), readPolicy(scope)]);
  const changed = await page.request.post(`${scope}/admin/policies`, {
    headers: staff,
    data: { request, changes: [{ entity: "policy", field: "minNoticeMin", value: 60 }] },
  });
  expect(changed.status()).toBe(201);
  let reset = false;
  try {
    expect((await readPolicy(scope)).activeVersionId).not.toBe(curated.activeVersionId);
    expect(await readPolicy("/api")).toEqual(base);
    const panel = bookingPanel(page);
    await panel.getByRole("button", { name: "Reset demo data" }).click();
    await page.getByRole("button", { name: "Reset scenario" }).click();
    await expect(panel.getByRole("status")).toHaveText("Demo data reset.");
    reset = true;
    const restored = await readPolicy(scope);
    expect(restored.activeVersionId).toBe(curated.activeVersionId);
    expect(restored.versions).toHaveLength(curated.versions.length + 1);
    expect(await readPolicy("/api")).toEqual(base);
  } finally {
    if (!reset) {
      expect((await page.request.post(`${scope}/demo/reset`, { headers: staff })).ok()).toBe(true);
    }
  }
});

test("follows a verified opening beyond the initial base demo dates", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Appointment date").locator("option").last()).toHaveText(
    "2026-12-16",
  );
  const changed = await page.request.post("/api/admin/policies", {
    headers: staff,
    data: { request, changes: [{ entity: "policy", field: "maxAdvanceDays", value: 35 }] },
  });
  expect(changed.status()).toBe(201);
  try {
    await page.goto("/?date=2026-12-16&serviceId=ultrasound&practitionerId=chen");
    await page.getByRole("button", { name: "Check next opening" }).click();
    await expect(page.getByLabel("Appointment date")).toHaveValue("2026-12-17");
    await expect(page.getByText("2026-12-17 at 09:00", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bookable in this demo" })).toBeVisible();
    await page.goto("/?date=2099-11-17");
    await expect(
      page.getByRole("heading", { name: "This playground link is invalid" }),
    ).toBeVisible();
  } finally {
    expect((await page.request.post("/api/demo/reset", { headers: staff })).ok()).toBe(true);
  }
});
