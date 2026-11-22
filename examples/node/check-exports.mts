import * as contracts from "@whynot/contracts";
import { HealthResponseSchema } from "@whynot/contracts/api";
import * as schemas from "@whynot/contracts/schemas";
import type { ClinicSnapshot, SyntheticSnapshotEnvelope } from "@whynot/contracts/schemas";
import * as engine from "@whynot/engine";
import * as narrator from "@whynot/narrator";
import * as templates from "@whynot/narrator/templates";
import type { TemplateDisplay } from "@whynot/narrator/templates";

const { schemaVersion, ClinicSnapshotSchema, SyntheticSnapshotEnvelopeSchema } = schemas;
const { TemplateNarrator } = templates;
const { catalog, catalogVersion, engineVersion, ...actions } = engine;
const apiStatus: "ok" = HealthResponseSchema.parse({ status: "ok" }).status;

if (
  contracts !== schemas ||
  narrator !== templates ||
  schemaVersion !== 1 ||
  catalogVersion < 1 ||
  !engineVersion ||
  apiStatus !== "ok"
) {
  throw new Error("Public runtime entry points disagree");
}
if (
  Object.keys(catalog).length !== 23 ||
  Object.values(actions).some((value) => typeof value !== "function")
) {
  throw new Error("Unexpected engine runtime exports");
}
const expectedActions = [
  "addElapsedDays",
  "addLocalDays",
  "addMinutes",
  "applyPolicyChanges",
  "datedSchedule",
  "evaluate",
  "explainRange",
  "formatOffsetInstant",
  "gridStarts",
  "intervalContains",
  "intervalsOverlap",
  "isBookable",
  "isOnLocalGrid",
  "localDate",
  "localDateDifference",
  "localMinuteOfDay",
  "parseOffsetInstant",
  "previewPolicyChanges",
  "projectForAudience",
  "resolveRecurringBoundary",
  "simulatePolicyChanges",
  "splitOvernightHours",
];
if (Object.keys(actions).sort().join() !== expectedActions.join()) {
  throw new Error("Missing or unrecognized engine entry point");
}

/** Check that types inferred outside the monorepo match runtime entry points. */
export function checkTypes(input: unknown) {
  const envelope: SyntheticSnapshotEnvelope = SyntheticSnapshotEnvelopeSchema.parse(input);
  const snapshot: ClinicSnapshot = ClinicSnapshotSchema.parse(envelope.snapshot);
  const display: TemplateDisplay = { timeZone: snapshot.clinic.timezone };
  return TemplateNarrator.renderStaff(
    engine.evaluate(snapshot, input, { now: envelope.now }),
    display,
  );
}
