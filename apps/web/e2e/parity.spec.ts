import { expect, test } from "@playwright/test";

for (const { scenario, reasons, alternative, selected, preference } of [
  {
    scenario: "H1",
    reasons: ["needs a 15-minute gap", "Dr. Vikram Mehta is unavailable"],
    alternative: /14:45.*Dr. Asha Rao/,
    selected: "2026-11-17 at 14:45",
    preference: "any",
  },
  {
    scenario: "H3",
    reasons: ["at least 2 hours of notice", "This request gives 1 hour"],
    alternative: /11:00.*Dr. Asha Rao/,
    selected: "2026-11-16 at 11:00",
    preference: "any",
  },
  {
    scenario: "H7",
    reasons: ["outside Dr. Lena Okafor's working hours"],
    alternative: /09:00.*with Dr. Asha Rao instead of Dr. Lena Okafor/,
    selected: "2026-11-18 at 09:00",
    preference: "rao",
  },
]) {
  test(`${scenario} explains the block and checks the selected alternative`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/?scenarioId=${scenario}`);
    const explanation = page.getByRole("region", { name: "Why this time is unavailable" });
    for (const reason of reasons)
      await expect(explanation.getByRole("listitem").filter({ hasText: reason })).toBeVisible();
    if (scenario === "H1") {
      await page.getByRole("radio", { name: "Staff" }).check();
      await expect(
        explanation.getByText(/Fictional annual leave/).filter({ visible: true }),
      ).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("staff-explanation.png"), fullPage: true });
      await page.getByRole("radio", { name: "Patient" }).check();
      await expect(explanation.getByText(/Fictional annual leave/)).toHaveCount(0);
    }
    await page.getByRole("button", { name: alternative }).click();
    await page.getByRole("button", { name: "Check alternative" }).click();
    await expect(page.getByRole("heading", { name: "Requested appointment" })).toBeFocused();
    await expect(page.getByRole("heading", { name: "Bookable in this demo" })).toBeVisible();
    await expect(page.getByText(selected, { exact: true })).toBeVisible();
    await expect(page.getByLabel("Practitioner preference")).toHaveValue(preference);
  });
}

test("H9 explains the referral requirement with the scenario clock", async ({ page }) => {
  await page.goto("/?scenarioId=H9");
  await expect(page.getByText("2026-11-16 at 06:00", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Calendar period")).toHaveValue("5");
  const range = page.getByRole("region", { name: "Calendar availability" });
  await expect(range.getByText("Ask your GP for a referral.")).toBeVisible();
  await expect(range.getByRole("button")).toHaveCount(0);
  await page.getByRole("radio", { name: "Staff" }).check();
  await expect(range.getByText("Confirm whether the patient can obtain a referral.")).toBeVisible();
});

test("H10 checks the next opening and restores the original selection on Back", async ({
  page,
}) => {
  await page.goto("/?scenarioId=H10");
  await expect(page.getByText("2026-11-19 at 09:00", { exact: true })).toBeVisible();
  const range = page.getByRole("region", { name: "Calendar availability" });
  const next = range.getByRole("button", { name: "Check next opening" });
  await next.click();
  await expect(page.getByRole("heading", { name: "Bookable in this demo" })).toBeVisible();
  await expect(page.getByText("2026-11-23 at 10:00", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Practitioner preference")).toHaveValue("okafor");
  await page.reload();
  await expect(page.getByText("2026-11-23 at 10:00", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Appointment date")).toHaveValue("2026-11-20");
  await expect(next).toBeVisible();
});
