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
  await expect(page.getByText("2026-11-17 at 14:30", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    "This appointment is unavailable at the requested time.",
  );
  await expect(page.getByText("2026-11-16 at 09:00", { exact: true })).toBeVisible();
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
  await expect(page.getByText("2026-11-19 at 10:00", { exact: true })).toBeVisible();
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

test("uses validated date, service, and practitioner selections", async ({ page }, testInfo) => {
  await page.goto("/?scenarioId=H7");
  const scenario = page.getByRole("combobox", { name: "Scenario" });
  await expect(scenario.locator("option:checked")).toHaveText("Consultation with Dr. Okafor");
  await page.screenshot({
    path: testInfo.outputPath("preferred-practitioner.png"),
    fullPage: true,
  });

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
    "scenarioId=H12",
    "audience=administrator",
    "date=2026-02-30",
    "date=2099-11-17",
    "days=8",
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

const explanation = (page: Page) =>
  page.getByRole("region", { name: "Why this time is unavailable" });

const reasonItem = (page: Page, hasText: string | RegExp) =>
  explanation(page).getByRole("listitem").filter({ hasText });

for (const { id, reasons, alternative, selected } of [
  {
    id: "H1",
    reasons: ["needs a 15-minute gap", "Dr. Vikram Mehta is unavailable"],
    alternative: /14:45.*Dr\. Asha Rao/,
    selected: "2026-11-17 at 14:45",
  },
  {
    id: "H3",
    reasons: ["at least 2 hours of notice", "This request gives 1 hour"],
    alternative: /11:00.*Dr\. Asha Rao/,
    selected: "2026-11-16 at 11:00",
  },
  {
    id: "H6",
    reasons: ["A room is under maintenance until 11:30", "A room is already in use"],
    alternative: /11:30.*Nurse Priya Iyer/,
    selected: "2026-11-17 at 11:30",
  },
]) {
  test(`${id} explains the blocked start and checks a verified alternative`, async ({ page }) => {
    await page.goto(`/?scenarioId=${id}`);
    for (const reason of reasons) await expect(reasonItem(page, reason)).toBeVisible();

    await page.getByRole("button", { name: alternative }).click();
    await page.getByRole("button", { name: "Check alternative" }).click();
    await expect(page.getByRole("heading", { name: "Bookable in this demo" })).toBeVisible();
    await expect(page.getByText(selected, { exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Practitioner preference" })).toHaveValue(
      "any",
    );
  });
}

test("keeps patient output free of staff evidence after switching views", async ({
  page,
}, testInfo) => {
  for (const [scenario, sensitive] of [
    ["H1", "Fictional annual leave"],
    ["H6", "h6-dressing"],
  ] as const) {
    await page.goto(`/?scenarioId=${scenario}&audience=staff`);
    await expect(reasonItem(page, sensitive)).toBeVisible();
    await page.getByText("Candidate blockers by practitioner", { exact: true }).click();
    await expect(explanation(page).getByText(/lowest-weight candidate/)).toBeVisible();
    await expect(
      explanation(page).getByRole("heading", { name: "Nurse Priya Iyer", exact: true }),
    ).toBeVisible();
    if (scenario === "H6") {
      await expectAccessible(page);
      await page.screenshot({ path: testInfo.outputPath("staff-blockers.png"), fullPage: true });
    }
    await page.getByRole("radio", { name: "Patient" }).check();
    await explanation(page).getByText("All scheduling conflicts considered").click();
    await expect(page.getByText("Candidate blockers by practitioner")).toHaveCount(0);
    await expect
      .poll(() => page.locator("main").innerHTML())
      .not.toMatch(/Fictional annual leave|mehta-leave|h1-procedure|h6-dressing|patient-\d/);
  }
});

test("reviews the H7 preference change with keyboard focus and honest search status", async ({
  page,
}, testInfo) => {
  await page.goto("/?scenarioId=H7");
  const alternatives = page.getByRole("region", { name: "Verified alternatives" });
  const options = alternatives.getByRole("heading", { level: 3 });
  await expect(options.nth(0)).toHaveText(/10:00.*with Dr\. Lena Okafor/);
  await expect(options.nth(1)).toHaveText(/09:00.*with Dr\. Asha Rao instead of Dr\. Lena Okafor/);
  await expect(alternatives.getByText("Dr. Lena Okafor → Dr. Asha Rao")).toBeVisible();
  await expect(alternatives.getByText(/Other openings may still be available/)).toBeVisible();
  await expect(alternatives.getByText(/requests checked/)).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: testInfo.outputPath("explanation-journey.png"), fullPage: true });

  await page.evaluate(() => {
    document.addEventListener("focusin", ({ target }) => {
      if (!(target instanceof HTMLButtonElement) || target.textContent !== "Cancel") return;
      const dialog = target.closest("dialog");
      if (!dialog) return;
      const description = dialog.getAttribute("aria-describedby");
      if (description)
        dialog.setAttribute(
          "data-description-at-focus",
          document.getElementById(description)?.textContent ?? "",
        );
    });
  });
  const review = alternatives.getByRole("button", { name: /review alternative.*09:00.*Rao/i });
  await review.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Check this alternative?" });
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  const raoChoice = /09:00.*with Dr\. Asha Rao/;
  await expect(dialog).toHaveAccessibleDescription(raoChoice);
  await expect(dialog).toHaveAttribute("data-description-at-focus", raoChoice);
  await expectAccessible(page);
  await page.screenshot({ path: testInfo.outputPath("alternative-dialog.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(review).toBeFocused();
  const earlierReview = alternatives.getByRole("button", {
    name: /review alternative.*18 Nov.*10:00.*Okafor/i,
  });
  await earlierReview.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveAttribute("data-description-at-focus", /10:00.*with Dr\. Lena Okafor/);
  await page.keyboard.press("Escape");
  await expect(earlierReview).toBeFocused();
  await review.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Check alternative" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Requested appointment" })).toBeFocused();
  await expect(page.getByRole("status")).toHaveText("This time is available");
  await expect(page.getByRole("heading", { name: "Bookable in this demo" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Practitioner preference" })).toHaveValue("rao");
  await expect(page.getByText("2026-11-18 at 09:00", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(review).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Bookable in this demo" })).toBeVisible();
});

test("updates availability with service, practitioner, date and explainable starts", async ({
  page,
}, testInfo) => {
  await page.goto("/?scenarioId=H3");
  const starts = page.getByRole("region", { name: "Appointment starts" });
  await starts.getByText("Choose a start", { exact: true }).click();
  const unavailable = starts.getByRole("button", { name: "10:15 Unavailable", exact: true });
  await expect(unavailable).toBeEnabled();
  await unavailable.click();
  await expect(unavailable).toHaveAttribute("aria-pressed", "true");
  await expect(reasonItem(page, /This request gives 1 hour 15 minutes/)).toBeVisible();
  await page.getByRole("link", { name: "Skip to playground" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(unavailable).toHaveAttribute("aria-pressed", "true");
  await expect(reasonItem(page, /This request gives 1 hour 15 minutes/)).toBeVisible();
  await expectAccessible(page);
  await starts.screenshot({ path: testInfo.outputPath("start-picker.png") });
  await starts.getByRole("button", { name: "11:00 Available", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("This time is available");
  await page.getByRole("combobox", { name: "Service", exact: true }).selectOption("dressing");
  await page.getByRole("combobox", { name: "Practitioner preference" }).selectOption("rao");
  await expect(
    starts.getByRole("button", { name: "11:00 Unavailable", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("combobox", { name: "Appointment date" }).selectOption("2026-11-22");
  await expect(starts.getByText("There are no scheduled starts on this date.")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    "This appointment is unavailable at the requested time.",
  );
  await page.getByRole("radio", { name: "Staff" }).check();
  await page.getByRole("button", { name: "Reset selections" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("combobox", { name: "Scenario" })).toBeFocused();
  await expect(page.getByRole("radio", { name: "Patient" })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Scenario" })).toHaveValue("H1");
});

test("shows actionable guidance when the search finds no verified alternative", async ({
  page,
}) => {
  await page.goto("/?scenarioId=H4");
  await expect(explanation(page).getByText(/an initial appointment or assessment/)).toBeVisible();
  const alternatives = page.getByRole("region", { name: "Verified alternatives" });
  await expect(alternatives.getByText("No verified alternatives to show.")).toBeVisible();
  await expect(alternatives.getByRole("button")).toHaveCount(0);
});
