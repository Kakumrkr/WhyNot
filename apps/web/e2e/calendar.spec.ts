import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { explainRange } from "@whynot/engine";
import { buildScenario, demoNow } from "@whynot/fixtures";

const calendar = (page: Page) => page.getByRole("region", { name: "Calendar availability" });

test("H9 explains the referral requirement across five days without offering an opening", async ({
  page,
}, testInfo) => {
  await page.goto("/?scenarioId=H9");
  const range = calendar(page);
  await expect(page.getByLabel("Calendar period")).toHaveValue("5");
  await expect(range.getByText("Ask your GP for a referral.")).toBeVisible();
  await expect(range.getByRole("heading", { name: "Eligibility next step" })).toBeVisible();
  await expect(range.getByRole("button")).toHaveCount(0);
  await expect(range.getByText(/^Starts from/)).toHaveCount(0);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual(
    [],
  );
  await range.screenshot({ path: testInfo.outputPath("referral-range.png") });

  await page.getByRole("radio", { name: "Staff" }).check();
  await expect(range.getByText("Confirm whether the patient can obtain a referral.")).toBeVisible();
  await expect(range.getByRole("button")).toHaveCount(0);
});

test("H10 opens Monday at 10:00 with Dr. Okafor and restores Friday on Back", async ({ page }) => {
  await page.goto("/?scenarioId=H10");
  const range = calendar(page);
  await expect(range.getByText(/outside Dr\. Lena Okafor's working hours/).first()).toBeVisible();
  await expect(range.getByText(/10:00.*with Dr\. Lena Okafor/)).toBeVisible();
  const next = range.getByRole("button", { name: "Check next opening" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Requested appointment" })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Bookable in this demo" })).toBeVisible();
  await expect(page.getByText("2026-11-23 at 10:00", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Practitioner preference")).toHaveValue("okafor");
  await expect(page.getByLabel("Appointment date")).toHaveValue("2026-11-23");
  await page.reload();
  await expect(page.getByText("2026-11-23 at 10:00", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Appointment date")).toHaveValue("2026-11-20");
  await expect(next).toBeVisible();
});

test("H11 shows mixed start windows and projects the patient view", async ({ page }, testInfo) => {
  await page.goto("/?scenarioId=H11&audience=staff");
  const range = calendar(page);
  await expect(
    range.getByText("No appointment starts are available on these dates."),
  ).toBeVisible();
  const requirements = range.getByText("Service requirements");
  expect((await requirements.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await requirements.click();
  await expect(range.getByText(/lacks the required skill/).first()).toBeVisible();
  const segments = range.getByText(/^Starts from/);
  await expect(segments.first()).toContainText(/08:00.*10:30/);
  for (const segment of await segments.all()) await segment.click();
  await expect(range.getByText(/at least 2 hours of notice/).first()).toBeVisible();
  await expect(
    range.getByText(/Dr\. Asha Rao is already booked at these starts/).first(),
  ).toBeVisible();
  await expect(range.getByText(/Fictional annual leave/).first()).toBeVisible();
  await range.screenshot({ path: testInfo.outputPath("mixed-range.png") });
  await page.getByRole("radio", { name: "Patient" }).check();
  await expect(range.getByText(/^Starts from/).first()).toBeVisible();
  await expect(range.getByText(/Fictional annual leave/)).toHaveCount(0);
  await expect(range.getByText(/08:00.*with Dr\. Vikram Mehta/)).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual(
    [],
  );
});

test("renders engine counts, closed days and an incomplete search with no checked window", async ({
  page,
}) => {
  const result = explainRange(
    buildScenario("H1"),
    {
      patientId: "patient-0",
      serviceId: "minor-procedure",
      fromDate: "2026-11-17",
      days: 7,
    },
    demoNow,
  );
  if (result.status !== "has_availability") throw new Error("Expected openings in the demo week");
  await page.goto("/?scenarioId=H1");
  await page.getByLabel("Calendar period").selectOption("7");
  await expect(
    calendar(page).getByText(`${result.bookableCount} appointment start times are available.`),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Calendar period")).toHaveValue("7");
  await page.goto("/?scenarioId=H1&date=2026-11-22");
  await expect(calendar(page).getByText(/The clinic is closed on/)).toBeVisible();
  await page.goto("/?scenarioId=H9&date=2026-12-16");
  const period = page.getByLabel("Calendar period");
  await expect(period).toHaveValue("1");
  await expect(period.locator("option")).toHaveText(["One day"]);
  await expect(calendar(page).getByText("Ask your GP for a referral.")).toBeVisible();
  await expect(calendar(page).getByText(/More schedule data is needed/)).toBeVisible();
  await expect(calendar(page).getByRole("button")).toHaveCount(0);

  await page.getByLabel("Appointment date").selectOption("2026-12-10");
  await period.selectOption("7");
  await page.getByLabel("Appointment date").selectOption("2026-12-12");
  await expect(period).toHaveValue("5");
  await expect(period.locator("option")).toHaveText(["One day", "Five days"]);
  await page.goBack();
  await expect(period).toHaveValue("7");

  await page.getByRole("button", { name: "Reset selections" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByLabel("Calendar period")).toHaveValue("1");
});

test("explicitly changes the practitioner when the preferred practitioner has no opening", async ({
  page,
}) => {
  await page.goto("/?scenarioId=H10&practitionerId=harris");
  const range = calendar(page);
  await expect(range.getByText(/instead of Physio Tom Harris/)).toBeVisible();
  await range.getByRole("button", { name: "Change practitioner and check opening" }).click();
  await expect(page.getByLabel("Practitioner preference")).not.toHaveValue("harris");
  await expect(page.getByLabel("Practitioner preference")).not.toHaveValue("any");
  await expect(page.getByRole("heading", { name: "Bookable in this demo" })).toBeVisible();
});
