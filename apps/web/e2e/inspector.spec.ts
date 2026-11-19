import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { evaluate } from "@whynot/engine";
import { buildScenario, demoNow, riversideMinute } from "@whynot/fixtures";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaffInspector } from "../src/StaffInspector.js";
import { staticAdapter } from "../src/adapter/staticAdapter.js";

test("shows H1 primary and other fact columns exactly where the staff trace places them", async ({
  page,
}, testInfo) => {
  const snapshot = buildScenario("H1");
  const result = evaluate(
    snapshot,
    { patientId: "patient-0", serviceId: "minor-procedure", start: riversideMinute(1, "14:30") },
    { now: demoNow, trace: true },
  );
  if (result.status !== "blocked" || !result.trace) throw new Error("Expected blocked H1 trace");
  const trace = result.trace;
  await page.goto("/?scenarioId=H1&audience=staff");
  const inspector = page.getByRole("region", { name: "Staff inspector" });
  await expect(inspector.getByText("Lowest-weight explanation proven")).toBeVisible();
  await expect(
    inspector.getByText(`Reduced matrix (${trace.reducedRows.length} rows)`),
  ).toBeVisible();

  const factKey = inspector.getByText(/^Fact key /);
  await factKey.focus();
  await page.keyboard.press("Enter");
  await expect(inspector.getByText(/Fictional annual leave/)).toBeVisible();

  for (const id of ["rao", "mehta", "chen"]) {
    const label = snapshot.practitioners.find((p) => p.id === id)?.displayName;
    const candidates = trace.candidates.filter(
      ({ assignment }) => assignment.practitionerId === id,
    );
    const summary = inspector.getByText(`${label} (${candidates.length})`, { exact: true });
    await summary.focus();
    await page.keyboard.press("Enter");
    const scroller = inspector.getByRole("region", { name: `${label} matrix scroll area` });
    await page.keyboard.press("Tab");
    await expect(scroller).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const matrix = scroller.getByRole("table", { name: `${label} candidate matrix` });
    const headers = matrix.getByRole("columnheader");
    await expect(headers).toHaveCount(trace.facts.length + 1);
    await expect(headers.filter({ hasText: "practitioner-buffer" }).first()).toHaveAccessibleName(
      /Primary.*15-minute after-appointment buffer/,
    );
    await expect(headers.filter({ hasText: "practitioner-time-off" })).toHaveAccessibleName(
      /Primary.*Fictional annual leave/,
    );
    for (const [index, fact] of trace.facts.entries()) {
      const marker = trace.selected.includes(fact.id) ? "Primary" : "Other violation";
      await expect(headers.nth(index + 1)).toHaveAccessibleName(
        new RegExp(`^F${index + 1} · ${marker} · `),
      );
    }
    const rows = matrix.locator("tbody").getByRole("row");
    await expect(rows).toHaveCount(candidates.length);
    for (const [index, candidate] of candidates.entries()) {
      await expect(rows.nth(index).getByRole("cell")).toHaveText(
        trace.facts.map(({ id }) => (candidate.factIds.includes(id) ? "Blocks" : "—")),
      );
    }
    if (id !== "rao") await summary.click();
  }
  const alternatives = page.getByRole("region", { name: "Verified alternatives" });
  await expect(alternatives.getByText("Same day", { exact: true })).toHaveCount(
    result.alternatives.filter(({ category }) => category === "same-day").length,
  );
  await expect(
    alternatives.locator(".alternative-ranking dd:nth-child(2)").filter({
      hasText: /^[\d.]+$/,
    }),
  ).toHaveText(result.alternatives.map(({ cost }) => String(cost)));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    testInfo.project.use.viewport?.width,
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual(
    [],
  );
  await factKey.click();
  await inspector.screenshot({ path: testInfo.outputPath("staff-inspector.png"), scale: "css" });
  await page.getByRole("radio", { name: "Patient" }).check();
  await expect(inspector).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("Fictional annual leave");
});

test("labels the fallback explanation and each capped trace independently", async ({ page }) => {
  const inspection = staticAdapter.open("?scenarioId=H1&audience=staff")?.check();
  if (inspection?.status !== "blocked" || !inspection.inspector) {
    throw new Error("Expected a staff inspector model");
  }
  // Curated inputs fit the caps. Exercise the presentation of capped metadata separately.
  await page.setContent(
    renderToStaticMarkup(
      createElement(StaffInspector, {
        inspection: {
          ...inspection.inspector,
          optimal: false,
          candidateCount: 500,
          alternativeCount: 3000,
          candidatesTruncated: true,
          alternativesTruncated: true,
        },
      }),
    ),
  );
  await expect(page.getByText("Lowest weight unproven.", { exact: false })).toBeVisible();
  await expect(page.getByText("500 recorded · truncated", { exact: true })).toBeVisible();
  await expect(page.getByText("3000 recorded · truncated", { exact: true })).toBeVisible();
});

test("loads a curated deep link and its production assets beneath the Pages repository path", async ({
  page,
}) => {
  const prefix = "/WhyNot";
  const requested: string[] = [];
  page.on("request", (request) => requested.push(new URL(request.url()).pathname));
  await page.route(`**${prefix}/**`, async (route) => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.slice(prefix.length);
    await route.fulfill({ response: await route.fetch({ url: url.href }) });
  });
  await page.goto(`${prefix}/?scenarioId=H1&audience=staff`);
  await expect(page.getByRole("region", { name: "Staff inspector" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Appointment playground" })).toHaveCSS(
    "font-family",
    /Georgia/,
  );
  await page.getByRole("radio", { name: "Patient" }).check();
  await expect(page).toHaveURL(/\/WhyNot\/\?scenarioId=H1&audience=patient$/);
  await page.reload();
  await expect(page.getByRole("radio", { name: "Patient" })).toBeChecked();
  expect(requested).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/^\/WhyNot\/assets\/.*\.js$/),
      expect.stringMatching(/^\/WhyNot\/assets\/.*\.css$/),
    ]),
  );
  expect(requested.every((path) => path.startsWith(`${prefix}/`))).toBe(true);
});
