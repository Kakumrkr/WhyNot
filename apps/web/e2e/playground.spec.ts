import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual(
    [],
  );
}

test("shows the curated request and frozen clock with no horizontal overflow", async ({
  page,
}, testInfo) => {
  const requests = new Set<string>();
  page.on("request", (request) => requests.add(new URL(request.url()).origin));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Appointment playground" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Scenario" })).toHaveValue("H1");
  await expect(page.getByRole("radio", { name: "Patient" })).toBeChecked();
  await expect(page.getByText("2026-11-17 at 14:30")).toBeVisible();
  await expect(page.getByText("This time is unavailable")).toBeVisible();
  await expect(page.getByText("2026-11-16 at 09:00")).toBeVisible();
  await expect(page.getByText("Europe/London", { exact: false })).toBeVisible();
  await expect(page.getByText(/fictional.*synthetic data only/i)).toBeVisible();
  expect([...requests]).toEqual([new URL(page.url()).origin]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    testInfo.project.use.viewport?.width,
  );
  await expectAccessible(page);
  await page.screenshot({ path: testInfo.outputPath("playground.png"), fullPage: true });
});

test("restores scenario and audience through reload and browser history", async ({ page }) => {
  await page.goto("/");
  const scenario = page.getByRole("combobox", { name: "Scenario" });
  const patient = page.getByRole("radio", { name: "Patient" });
  const staff = page.getByRole("radio", { name: "Staff" });
  await scenario.selectOption({ label: "Ultrasound" });
  await staff.check();
  await expect(page).toHaveURL(/\?scenarioId=H2&audience=staff$/);
  await expect(page.getByText("2026-11-19 at 10:00")).toBeVisible();
  await page.reload();
  await expect(scenario).toHaveValue("H2");
  await expect(staff).toBeChecked();
  await page.goBack();
  await expect(patient).toBeChecked();
  await expect(scenario).toHaveValue("H2");
  await page.goBack();
  await expect(scenario).toHaveValue("H1");
  await page.goForward();
  await expect(scenario).toHaveValue("H2");
});

test("uses validated date, service, and practitioner selections", async ({ page }) => {
  await page.goto("/?scenarioId=H7&date=2026-11-19&serviceId=ultrasound&practitionerId=chen");
  const request = page.getByRole("region", { name: "Requested appointment" });
  await expect(request.getByText("2026-11-19 at 09:00")).toBeVisible();
  await expect(request.getByText("Sonographer Mei Chen")).toBeVisible();
  await expect(request.getByText("Ultrasound scan", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Staff" }).check();
  await expect(page).toHaveURL(
    /date=2026-11-19&serviceId=ultrasound&practitionerId=chen&audience=staff$/,
  );
  await expect(request.getByText("2026-11-19 at 09:00")).toBeVisible();
});

test("rejects unsafe or invalid link selections and resets with keyboard focus", async ({
  page,
}) => {
  for (const query of [
    "scenarioId=H9",
    "audience=administrator",
    "date=2026-02-30",
    "date=2099-11-17",
    "serviceId=unknown",
    "practitionerId=unknown",
    "audience=staff&audience=patient",
    "payload=hidden-data",
  ]) {
    await page.goto(`/?${query}`);
    await expect(
      page.getByRole("heading", { name: "This playground link is invalid" }),
    ).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Scenario" })).toHaveCount(0);
  }
  await expect(page.getByText("hidden-data")).toHaveCount(0);
  await expectAccessible(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Reset selections" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("combobox", { name: "Scenario" })).toBeFocused();
  await expect(page.getByRole("radio", { name: "Patient" })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Scenario" })).toHaveValue("H1");
});

test("has a visible keyboard path through the skip link, picker and audience", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to playground" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  const scenario = page.getByRole("combobox", { name: "Scenario" });
  await expect(scenario).toBeFocused();
  await expect(scenario).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: "Patient" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Staff" })).toBeFocused();
  await expect(page.getByRole("radio", { name: "Staff" })).toBeChecked();
});
