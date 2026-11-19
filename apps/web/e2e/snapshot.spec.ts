import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SyntheticSnapshotEnvelopeSchema } from "@whynot/contracts/schemas";

const ownSnapshot = new URL("../../../examples/node/snapshot.json", import.meta.url);

async function openFiles(page: Page) {
  await page.getByText("Synthetic snapshot files", { exact: true }).click();
  return page.getByLabel("Import snapshot JSON");
}

function jsonFile(data: unknown) {
  return {
    name: "snapshot.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  };
}

test("checks and round-trips an imported snapshot without storing or sharing selections", async ({
  page,
}, testInfo) => {
  await page.goto("/?scenarioId=H2&audience=staff");
  const url = page.url();
  const previous = await page.evaluate(() => ({ history: history.state, length: history.length }));
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const file = await openFiles(page);
  const snapshot = SyntheticSnapshotEnvelopeSchema.parse(
    JSON.parse(await readFile(ownSnapshot, "utf8")),
  );
  const markup = '<img src="/payload-marker" onerror="window.importedMarkup = true">';
  snapshot.snapshot.clinic.name = markup;
  snapshot.snapshot.services[0]!.displayName = "<strong>Imported intake</strong>";
  snapshot.snapshot.practitioners[0]!.id = "any";
  await file.setInputFiles(jsonFile(snapshot));
  await expect(page.getByText("Imported snapshot active.")).toBeVisible();
  await expect(page.getByText(markup, { exact: true })).toBeVisible();
  const request = page.getByRole("region", { name: "Requested appointment" });
  await expect(
    request.getByText("<strong>Imported intake</strong>", { exact: true }),
  ).toBeVisible();
  await expect(request.getByRole("status")).toHaveText(
    "This appointment is unavailable at the requested time.",
  );
  await expect(page.getByRole("radio", { name: "Patient" })).toBeChecked();
  await page.getByRole("radio", { name: "Staff" }).check();
  await page.getByLabel("Practitioner preference").selectOption("any");
  await expect(request.getByText("Taylor Lee", { exact: true })).toBeVisible();
  await page.getByLabel("Practitioner preference").selectOption("");
  await expect(request.getByText("Any practitioner", { exact: true })).toBeVisible();
  await page.getByLabel("Appointment date").selectOption("2026-11-17");
  await expect(request.getByText("2026-11-17 at 00:00")).toBeVisible();
  await expect(page).toHaveURL(url);
  expect(
    await page.evaluate(() => ({
      history: history.state,
      length: history.length,
      local: localStorage.length,
      session: sessionStorage.length,
      markupExecuted: "importedMarkup" in window,
    })),
  ).toEqual({ ...previous, local: 0, session: 0, markupExecuted: false });
  expect(requests).toEqual([]);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual(
    [],
  );
  await page.getByRole("button", { name: "Export snapshot JSON" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("synthetic-snapshot.png") });
  const downloadStarted = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export snapshot JSON" }).click();
  const download = await downloadStarted;
  const path = await download.path();
  expect(JSON.parse(await readFile(path, "utf8"))).toEqual(snapshot);
  await page.getByRole("button", { name: "Reset imported snapshot" }).click();
  await expect(file).toBeFocused();
  await expect(page.getByLabel("Scenario")).toHaveValue("H2");
  await expect(page.getByRole("radio", { name: "Staff" })).toBeChecked();
  await file.setInputFiles(path);
  await expect(page.getByText("Imported snapshot active.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Scenario")).toHaveValue("H2");
  await expect(page.getByText(markup, { exact: true })).toHaveCount(0);
});

test("rejects malformed, unsupported, oversized and invalid-reference imports before replacing the scenario", async ({
  page,
}) => {
  await page.goto("/");
  const file = await openFiles(page);
  const read = async () =>
    SyntheticSnapshotEnvelopeSchema.parse(JSON.parse(await readFile(ownSnapshot, "utf8")));
  const reference = await read();
  reference.snapshot.patients[0]!.referrals = ["payload-marker"];
  const coverage = await read();
  coverage.snapshot.coverage.to = coverage.snapshot.coverage.from + 32 * 1440;
  const resources = await read();
  resources.snapshot.rooms = Array.from({ length: 101 }, (_, index) => ({
    ...resources.snapshot.rooms[0]!,
    id: `room-${index}`,
  }));
  const candidates = await read();
  candidates.snapshot.services[0]!.requiredEquipmentType = "scanner";
  candidates.snapshot.practitioners = Array.from({ length: 28 }, (_, index) => ({
    ...candidates.snapshot.practitioners[0]!,
    id: `practitioner-${index}`,
  }));
  candidates.snapshot.rooms = resources.snapshot.rooms.slice(0, 28);
  candidates.snapshot.equipment = Array.from({ length: 26 }, (_, index) => ({
    id: `equipment-${index}`,
    displayName: `Scanner ${index}`,
    type: "scanner",
    maintenance: [],
  }));
  for (const [payload, error] of [
    [{ ...jsonFile(null), buffer: Buffer.from("{broken") }, /valid UTF-8 JSON/],
    [{ ...jsonFile(null), buffer: Buffer.from([0xc3, 0x28]) }, /valid UTF-8 JSON/],
    [{ ...jsonFile(null), buffer: Buffer.alloc(256 * 1024 + 1) }, /256 KiB/],
    [jsonFile({ ...(await read()), schemaVersion: 2 }), /unsupported.*version 1/],
    [jsonFile(reference), /unknown reference at snapshot.patients.0.referrals.0/],
    [jsonFile(coverage), /31 local dates/],
    [jsonFile(resources), /snapshot.rooms.*100/],
    [jsonFile(candidates), /20,000 candidate combinations/],
  ] as const) {
    await file.setInputFiles(payload);
    await expect(page.getByRole("alert")).toHaveText(error);
    await expect(page.getByLabel("Scenario")).toHaveValue("H1");
    await expect(page.getByText("payload-marker", { exact: false })).toHaveCount(0);
  }
});

test("opens the exported curated snapshot and handles the absence of a usable start", async ({
  page,
}) => {
  await page.goto("/?scenarioId=H9");
  const file = await openFiles(page);
  const downloadStarted = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export snapshot JSON" }).click();
  const path = await (await downloadStarted).path();
  const curated = SyntheticSnapshotEnvelopeSchema.parse(JSON.parse(await readFile(path, "utf8")));
  expect(curated.snapshot.clinic.name).toBe("Riverside Family Clinic");
  await file.setInputFiles(path);
  await expect(page.getByText("Imported snapshot active.")).toBeVisible();
  const partial = SyntheticSnapshotEnvelopeSchema.parse(
    JSON.parse(await readFile(ownSnapshot, "utf8")),
  );
  partial.snapshot.coverage.from = 29913660;
  partial.snapshot.coverage.to = 29913661;
  await file.setInputFiles(jsonFile(partial));
  await expect(page.getByText("No start fits in snapshot coverage on this date")).toBeVisible();
  partial.snapshot.patients = [];
  await file.setInputFiles(jsonFile(partial));
  await expect(
    page.getByRole("heading", { name: "No appointment request to check" }),
  ).toBeVisible();
});

test("offers starts on an imported date with a skipped local midnight", async ({ page }) => {
  await page.goto("/");
  const file = await openFiles(page);
  const envelope = SyntheticSnapshotEnvelopeSchema.parse(
    JSON.parse(await readFile(ownSnapshot, "utf8")),
  );
  const { snapshot } = envelope;
  snapshot.clinic.timezone = "America/Sao_Paulo";
  snapshot.clinic.openingHours = [{ weekday: 7, from: "09:00", to: "12:00" }];
  snapshot.practitioners[0]!.workingHours = snapshot.clinic.openingHours;
  snapshot.coverage = {
    from: Date.parse("2018-11-04T01:00:00-02:00") / 60000,
    to: Date.parse("2018-11-05T00:00:00-02:00") / 60000,
  };
  envelope.now = Date.parse("2018-11-04T06:00:00-02:00") / 60000;
  await file.setInputFiles(jsonFile(envelope));
  const request = page.getByRole("region", { name: "Requested appointment" });
  await expect(request.getByText("2018-11-04 at 09:00")).toBeVisible();
  await expect(request.getByRole("status")).toHaveText("This time is available");
  await page.getByText("Choose a start", { exact: true }).click();
  await page.getByRole("button", { name: "09:15 Available", exact: true }).click();
  await expect(request.getByText("2018-11-04 at 09:15")).toBeVisible();
  await expect(request.getByRole("status")).toHaveText("This time is available");
});

test("distinguishes repeated wall times by offset in an imported clinic", async ({ page }) => {
  await page.goto("/");
  const file = await openFiles(page);
  const envelope = SyntheticSnapshotEnvelopeSchema.parse(
    JSON.parse(await readFile(ownSnapshot, "utf8")),
  );
  const { snapshot } = envelope;
  snapshot.clinic.timezone = "Europe/Berlin";
  snapshot.clinic.openingHours = [{ weekday: 7, from: "01:00", to: "04:00" }];
  snapshot.practitioners[0]!.workingHours = snapshot.clinic.openingHours;
  snapshot.coverage = {
    from: Date.parse("2026-10-25T00:00:00+02:00") / 60000,
    to: Date.parse("2026-10-26T00:00:00+01:00") / 60000,
  };
  envelope.now = Date.parse("2026-10-24T19:00:00+02:00") / 60000;
  await file.setInputFiles(jsonFile(envelope));
  await expect(page.getByText("Imported snapshot active.")).toBeVisible();
  const request = page.getByRole("region", { name: "Requested appointment" });
  await page.getByText("Choose a start", { exact: true }).click();
  for (const offset of ["+02:00", "+01:00"]) {
    await page.getByRole("button", { name: `02:00 (UTC${offset}) Available`, exact: true }).click();
    await expect(request.getByText(`2026-10-25 at 02:00 (UTC${offset})`)).toHaveAttribute(
      "datetime",
      `2026-10-25T02:00:00${offset}`,
    );
  }
});
