import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const [scenario, delta, practitioner] of [
  ["H1", "15 → 0", "Dr. Asha Rao"],
  ["H3", "120 → 60", "Dr. Asha Rao"],
  ["H5", "6 → 7", "Physio Tom Harris"],
  ["H4", "Returning patients only → Any patient", "Physio Tom Harris"],
] as const) {
  test(`${scenario} previews a verified patch and resets to the untouched request`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/?scenarioId=${scenario}&audience=staff`);
    const panel = page.getByRole("region", { name: "Policy playground" });
    const request = page.getByRole("region", { name: "Requested appointment" });
    await expect(panel).toBeVisible();
    const originalVerdict = await request.getByRole("status").innerText();
    const toggle = panel.getByText("Explore policy changes");
    expect((await toggle.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await toggle.focus();
    await page.keyboard.press("Enter");
    await panel.getByLabel("Setting to preview").selectOption("suggested");
    await panel.getByRole("button", { name: "Preview change" }).press("Enter");
    await expect(panel.getByText(delta, { exact: true })).toBeVisible();
    await expect(panel.getByText(/Original request/)).toBeVisible();
    await expect(panel.getByText("This appointment can be booked.", { exact: true })).toBeVisible();
    await expect(panel.getByText(/Assignment ·/)).toContainText(practitioner);
    await expect(request.getByRole("status")).toHaveText(originalVerdict);
    await expect(page).toHaveURL(`/?scenarioId=${scenario}&audience=staff`);
    if (scenario === "H4") {
      await expect(
        panel.getByText(/Buffer and eligibility changes are hypothetical/),
      ).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(
        violations.filter(({ impact }) => impact === "serious" || impact === "critical"),
      ).toEqual([]);
      await panel.screenshot({ path: testInfo.outputPath("policy-preview.png") });
    }
    await panel.getByRole("button", { name: "Reset preview" }).click();
    await expect(panel.getByText(/Original request/)).toHaveCount(0);
    await expect(request.getByRole("status")).toHaveText(originalVerdict);
  });
}

test("validates manual changes, preserves physical conflicts and clears state on navigation", async ({
  page,
}) => {
  await page.goto("/?scenarioId=H6&audience=staff");
  const panel = page.getByRole("region", { name: "Policy playground" });
  await panel.getByText("Explore policy changes").click();
  await expect(panel.getByText("There is no verified policy fix for this request.")).toBeVisible();
  await panel.getByLabel("Setting to preview").selectOption({ label: "Minimum notice (minutes)" });
  const value = panel.getByLabel("New value");
  await value.fill("-1");
  await panel.getByRole("button", { name: "Preview change" }).click();
  await expect(panel.getByRole("status")).toHaveText("Invalid or conflicting policy changes");
  await expect(value).toHaveAttribute("aria-invalid", "true");
  await value.fill("0");
  await panel.getByRole("button", { name: "Preview change" }).click();
  await expect(panel.getByRole("status")).toHaveText("Policy preview ready.");
  await expect(panel.getByText("This appointment can be booked.", { exact: true })).toHaveCount(0);
  await page.getByLabel("Scenario").selectOption("H1");
  await panel.getByText("Explore policy changes").click();
  await expect(panel.getByLabel("Setting to preview")).toHaveValue("");
  await panel.getByLabel("Setting to preview").selectOption("suggested");
  await panel.getByRole("button", { name: "Preview change" }).click();
  await page.getByRole("radio", { name: "Patient" }).check();
  await expect(panel).toHaveCount(0);
  await page.getByRole("radio", { name: "Staff" }).check();
  await panel.getByText("Explore policy changes").click();
  await expect(panel.getByLabel("Setting to preview")).toHaveValue("");
});

test("requires an explicit daily cap for an uncapped practitioner", async ({ page }) => {
  await page.goto("/?scenarioId=H11&audience=staff");
  const panel = page.getByRole("region", { name: "Policy playground" });
  await panel.getByText("Explore policy changes").click();
  await panel.getByLabel("Setting to preview").selectOption({
    label: "Dr. Asha Rao · Practitioner daily cap",
  });
  const value = panel.getByLabel("New value");
  const preview = panel.getByRole("button", { name: "Preview change" });
  await expect(value).toHaveValue("");
  await preview.click();
  await expect(panel.getByRole("status")).toHaveText("Invalid or conflicting policy changes");
  await expect(panel.getByText("No cap → 0")).toHaveCount(0);
  await value.fill("0");
  await preview.click();
  await expect(panel.getByText("No cap → 0")).toBeVisible();
});
