import {
  SyntheticSnapshotEnvelopeSchema,
  schemaVersion,
  type SyntheticSnapshotEnvelope,
} from "@whynot/contracts/schemas";
import { formatOffsetInstant, localDate, localDateDifference } from "@whynot/engine";

const maxBytes = 256 * 1024;

/** Read a local file only after checking its size and validate before opening a scenario. */
export async function readSnapshot(file: File): Promise<SyntheticSnapshotEnvelope> {
  if (file.size > maxBytes) throw new Error("Choose a JSON file of 256 KiB or less.");
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()));
  } catch {
    throw new Error("Choose a valid UTF-8 JSON file.");
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    value.schemaVersion !== schemaVersion
  ) {
    throw new Error("This snapshot version is unsupported. Use schema version 1.");
  }
  const parsed = SyntheticSnapshotEnvelopeSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".");
    if (issue?.code === "too_big") {
      throw new Error(`Reduce ${field} to at most ${issue.maximum} entries.`);
    }
    if (issue?.message.startsWith("Unknown ") && issue.message.endsWith(" reference")) {
      throw new Error(`Correct the unknown reference at ${field}.`);
    }
    if (issue?.message === "Import exceeds 20000 candidate combinations") {
      throw new Error("Reduce resources to at most 20,000 candidate combinations per service.");
    }
    throw new Error(
      field ? `Check the snapshot field ${field}.` : "Use a WhyNot snapshot envelope.",
    );
  }
  const { snapshot, now } = parsed.data;
  const { timezone } = snapshot.clinic;
  const first = localDate(snapshot.coverage.from, timezone);
  const last = localDate(snapshot.coverage.to - 1, timezone);
  if (!first.ok || !last.ok || !formatOffsetInstant(now, timezone).ok) {
    throw new Error(
      "Use supported coverage dates and a supported frozen clock in the clinic zone.",
    );
  }
  const days = localDateDifference(first.value, last.value);
  if (!days.ok || days.value < 0 || days.value >= 31) {
    throw new Error("Limit snapshot coverage to 31 local dates.");
  }
  return parsed.data;
}

/** Build the versioned file locally, including the clock used for this snapshot. */
export function snapshotFile(envelope: SyntheticSnapshotEnvelope): Blob {
  return new Blob([JSON.stringify(envelope)], { type: "application/json" });
}
