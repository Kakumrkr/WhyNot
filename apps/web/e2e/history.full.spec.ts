import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { InsightsResponse } from "@whynot/contracts/api";

async function openHistory(page: Page) {
  const open = page.getByRole("button", { name: "Show history insights" });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(open).toBeHidden();
  return page.getByRole("region", { name: "History insights" });
}

test("shows seeded outcomes and replays a verified fix against the selected history", async ({
  page,
}, testInfo) => {
  await page.goto("/?audience=staff");
  await page.getByText("Choose a start", { exact: true }).click();
  await page.getByRole("button", { name: "10:00 Unavailable", exact: true }).click();

  const history = await openHistory(page);
  const outcomes = history.getByRole("region", { name: "Recorded outcomes" });
  await expect(outcomes.getByText("Slot evaluations", { exact: true }).locator("..")).toContainText(
    "8",
  );
  await expect(
    outcomes.getByText("Range evaluations", { exact: true }).locator(".."),
  ).toContainText("4");
  const ruleTable = history.getByRole("table", { name: "Reported primary rule counts" });
  await expect(ruleTable.getByRole("row", { name: /min notice/ })).toBeVisible();
  await expect(history.locator(".history-chart svg").first()).toBeVisible();

  const replay = history.getByRole("region", { name: "Independent replay estimate" });
  const run = replay.getByRole("button", { name: "Replay verified policy fix" });
  await expect(replay.getByText("Minimum notice (minutes)", { exact: true })).toBeVisible();
  await expect(replay.getByRole("heading", { name: "Independent replay estimate" })).toBeVisible();
  await page.route(
    "**/api/admin/simulate",
    async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: { code: "internal_error", message: "Test failure" } },
      });
    },
    { times: 1 },
  );
  await run.click();
  await expect(replay.getByRole("alert")).toHaveText("Could not replay the stored slots.");
  await expect(replay.getByRole("heading", { name: "Independent replay estimate" })).toBeVisible();
  await replay.getByRole("button", { name: "Retry replay" }).click();
  const counts = replay.getByRole("table", { name: "Historical replay counts" });
  await expect(counts.getByRole("row", { name: "Eligible slots 8" })).toBeVisible();
  await expect(counts.getByRole("row", { name: "Newly feasible 2" })).toBeVisible();
  await expect(counts.getByRole("row", { name: /Unsupported engine version 0/ })).toBeVisible();
  await expect(
    replay
      .getByRole("table", { name: "Before and after examples" })
      .getByRole("row", { name: /Blocked Bookable/ }),
  ).toBeVisible();
  await expect(replay.getByRole("heading", { name: "Independent replay estimate" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Policy playground" })).toBeVisible();
  await expect(history).not.toContainText(/lost bookings|recovered revenue/i);

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual(
    [],
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    testInfo.project.use.viewport?.width,
  );
  await history.screenshot({ path: testInfo.outputPath("history-dashboard.png"), scale: "css" });

  await page.getByRole("radio", { name: "Patient" }).check();
  await expect(history).toHaveCount(0);
});

const empty = {
  rangeEvaluations: 0,
  slots: {
    total: 0,
    bookable: 0,
    blocked: 0,
    invalid: 0,
    unreadable: 0,
    blockedShare: { denominator: 0, fraction: null },
  },
  reportedPrimaryRules: { denominator: 0, counts: [] },
  verifiedFixFeasibility: { denominator: 0, feasible: 0 },
};

test("renders supplied denominators and continues a partial source page", async ({ page }) => {
  await page.route("**/api/admin/insights?*", async (route) => {
    const { searchParams } = new URL(route.request().url());
    const window = { from: searchParams.get("from")!, to: searchParams.get("to")! };
    const last = searchParams.has("afterId");
    const synthetic: InsightsResponse["sources"][1] = {
      source: "synthetic_history",
      rangeEvaluations: 2,
      slots: {
        total: 5,
        bookable: 1,
        blocked: 3,
        invalid: 1,
        unreadable: 0,
        blockedShare: { denominator: 4, fraction: 0.75 },
      },
      reportedPrimaryRules: { denominator: 3, counts: [{ ruleId: "min-notice", count: 2 }] },
      verifiedFixFeasibility: { denominator: 2, feasible: 1 },
    };
    const sources: InsightsResponse["sources"] = [
      { ...empty, source: "live_demo", rangeEvaluations: 1 },
      last ? { ...empty, source: "synthetic_history" } : synthetic,
    ];
    const response: InsightsResponse = last
      ? { status: "ok", window, sources, nextCursor: null }
      : {
          status: "partial",
          window,
          sources,
          nextCursor: { afterAt: window.from, afterId: "fixture" },
        };
    await route.fulfill({ json: response });
  });
  await page.goto("/?audience=staff");
  const history = await openHistory(page);
  await expect(history.getByText("Blocked share", { exact: true }).locator("..")).toContainText(
    "75%",
  );
  await expect(history.getByText("3 of 4 decided slots")).toBeVisible();
  await expect(history.getByText("Of 2 blocked slots assessed")).toBeVisible();
  await expect(history.getByRole("row", { name: "min notice 2" })).toBeVisible();
  await history.getByRole("button", { name: "Next history page" }).click();
  await expect(history.getByRole("heading", { name: "Recorded outcomes" })).toBeFocused();
  await expect(history.getByText("Page 2 · Counts are for this page.")).toBeVisible();
  await expect(history.getByText("No evaluations for this source on this page.")).toBeVisible();
  await history.getByLabel("History source").selectOption("live_demo");
  await history.getByRole("button", { name: "Apply history filters" }).click();
  await expect(history.getByText("Live demo captures loaded.")).toBeVisible();
});

test("retries a failed history read and applies a date filter that has no data", async ({
  page,
}) => {
  await page.route(
    "**/api/admin/insights?*",
    async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: { code: "internal_error", message: "Test failure" } },
      });
    },
    { times: 1 },
  );
  await page.goto("/?audience=staff");
  const history = await openHistory(page);
  await expect(history.getByRole("alert")).toHaveText("Could not load history insights.");
  await history.getByRole("button", { name: "Retry history" }).click();
  await expect(history.getByText("Seeded synthetic history loaded.")).toBeVisible();
  await history.getByLabel("From date (UTC)").fill("2020-01-01");
  await history.getByLabel("Before date (UTC)").fill("2020-01-01");
  await history.getByRole("button", { name: "Apply history filters" }).click();
  await expect(history.getByRole("alert")).toHaveText(
    "The before date must be later than the from date.",
  );
  await history.getByLabel("Before date (UTC)").fill("2020-01-02");
  await history.getByRole("button", { name: "Apply history filters" }).click();
  await expect(history.getByText("No evaluations for this source on this page.")).toBeVisible();
  await expect(history.getByRole("heading", { name: "Independent replay estimate" })).toBeVisible();
});
