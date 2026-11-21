import { EvaluateOptionsSchema, RangeOptionsSchema } from "@whynot/contracts";
import { addLocalDays } from "@whynot/engine";
import { buildRiverside, riversideMinute } from "@whynot/fixtures";
import { inArray } from "drizzle-orm";
import { demoClock, type DemoClock } from "../clock/demoClock.js";
import type { Database } from "../db/database.js";
import { evaluationRecord, syntheticHistoryPrefix, type Capture } from "../db/evaluations.js";
import { evaluationInputs } from "../db/schema.js";

function historyDate(date: string, days: number): string {
  const shifted = addLocalDays(date, days);
  if (!shifted.ok) throw new Error("Synthetic history date exceeds the calendar");
  return shifted.value;
}

function historyRequests({ date, now }: DemoClock) {
  const slot = (patientId: string, serviceId: string, day: number, time: string): Capture => ({
    kind: "slot",
    request: { patientId, serviceId, start: riversideMinute(day, time, date) },
    options: EvaluateOptionsSchema.parse({
      now,
      alternatives: { max: 3, searchDays: 1, budgetEvals: 300 },
    }),
  });
  const range = (patientId: string, serviceId: string, day: number, days: number): Capture => ({
    kind: "range",
    request: { patientId, serviceId, fromDate: historyDate(date, day), days },
    options: RangeOptionsSchema.parse({ now, searchDays: 2, budgetEvals: 300 }),
  });
  const samples = {
    "slot-notice": slot("patient-0", "consult", 0, "10:00"),
    "slot-ultrasound": slot("patient-0", "ultrasound", 3, "10:00"),
    "slot-follow-up": slot("patient-1", "physio-follow-up", 2, "11:00"),
    "slot-consult": slot("patient-6", "consult", 2, "14:00"),
    "range-consult": range("patient-6", "consult", 2, 1),
    "range-ultrasound": range("patient-1", "ultrasound", 1, 2),
  };
  return Object.entries(samples).map(([name, input]) => ({
    id: `${syntheticHistoryPrefix}${date}-${name}`,
    input,
  }));
}

/** Add reproducible history from independent fictional weeks while preserving existing records. */
export async function seedSyntheticHistory(tx: Database, liveClock: DemoClock): Promise<void> {
  for (const weeksAgo of [2, 1]) {
    const clock = demoClock(historyDate(liveClock.date, -7 * weeksAgo));
    const requests = historyRequests(clock);
    const existing = await tx
      .select({ id: evaluationInputs.id })
      .from(evaluationInputs)
      .where(
        inArray(
          evaluationInputs.id,
          requests.map(({ id }) => id),
        ),
      );
    const recorded = new Set(existing.map(({ id }) => id));
    const missing = requests.filter(({ id }) => !recorded.has(id));
    if (missing.length === 0) continue;

    const snapshot = buildRiverside(clock.date, 1729 + weeksAgo);
    const records = missing.map(({ id, input }) => {
      const record = evaluationRecord(id, snapshot, input);
      if (record.result.status === "invalid_request")
        throw new Error("Synthetic history request is invalid");
      // Generated records carry no observed runtime measurement.
      return { ...record, durationMs: 0 };
    });
    await tx.insert(evaluationInputs).values(records).onConflictDoNothing();
  }
}
