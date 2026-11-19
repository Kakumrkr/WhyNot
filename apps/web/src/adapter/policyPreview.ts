import type {
  BookingRequest,
  ClinicSnapshot,
  PolicyChange,
  StaffEvaluation,
} from "@whynot/contracts";
import { previewPolicyChanges } from "@whynot/engine";
import { TemplateNarrator, type TemplateDisplay } from "@whynot/narrator";

type DailyCapChange = Extract<PolicyChange, { entity: "practitioner" }>;
type EditableSetting = PolicyChange | (Omit<DailyCapChange, "value"> & { value: undefined });

const settingLabels = {
  minNoticeMin: "Minimum notice (minutes)",
  maxAdvanceDays: "Maximum advance window (days)",
  patientMaxBookingsPerDay: "Patient bookings per day",
  dailyCap: "Practitioner daily cap",
  bufferAfterMin: "After-appointment buffer (minutes)",
  roomTurnoverMin: "Room turnover (minutes)",
  eligibility: "Eligibility",
} satisfies Record<PolicyChange["field"], string>;

function settingLabel(change: EditableSetting, display: TemplateDisplay) {
  const field = settingLabels[change.field];
  if (change.entity === "policy") return field;
  const entries = change.entity === "service" ? display.services : display.practitioners;
  return `${entries?.get(change.id) ?? change.id} · ${field}`;
}

function settingValue(snapshot: ClinicSnapshot, change: PolicyChange) {
  if (change.entity === "policy") return snapshot.policy[change.field];
  if (change.entity === "practitioner")
    return (
      snapshot.practitioners.find(({ id }) => id === change.id)!.dailyCap ??
      snapshot.policy.defaultDailyCap
    );
  const service = snapshot.services.find(({ id }) => id === change.id)!;
  return service[change.field];
}

function displayValue(value: number | string | undefined) {
  if (value === undefined) return "No cap";
  if (value === "returning_only") return "Returning patients only";
  if (value === "any") return "Any patient";
  return String(value);
}

/** Supply editable settings and compare engine evaluations of the same staff request. */
export function policyPreview(
  snapshot: ClinicSnapshot,
  request: BookingRequest,
  now: number,
  display: TemplateDisplay,
) {
  const settings: EditableSetting[] = [
    { entity: "policy", field: "minNoticeMin", value: snapshot.policy.minNoticeMin },
    { entity: "policy", field: "maxAdvanceDays", value: snapshot.policy.maxAdvanceDays },
    {
      entity: "policy",
      field: "patientMaxBookingsPerDay",
      value: snapshot.policy.patientMaxBookingsPerDay,
    },
    ...snapshot.practitioners.map(({ id, dailyCap }) => ({
      entity: "practitioner" as const,
      id,
      field: "dailyCap" as const,
      value: dailyCap ?? snapshot.policy.defaultDailyCap,
    })),
  ];
  for (const service of snapshot.services) {
    for (const field of ["bufferAfterMin", "roomTurnoverMin"] as const)
      settings.push({ entity: "service", id: service.id, field, value: service[field] });
    if (service.eligibility === "returning_only")
      settings.push({ entity: "service", id: service.id, field: "eligibility", value: "any" });
  }

  function summarize(evaluation: StaffEvaluation) {
    const { headline, primary } = TemplateNarrator.renderStaff(evaluation, display);
    const assignment = evaluation.status === "bookable" ? evaluation.assignment : null;
    return {
      headline,
      reasons: primary.sentences.map(({ text }) => text),
      assignment: assignment && {
        practitioner: display.practitioners?.get(assignment.practitionerId),
        room: display.rooms?.get(assignment.roomId),
        equipment: assignment.equipmentId ? display.equipment?.get(assignment.equipmentId) : null,
      },
    };
  }

  return {
    settings: settings.map((change) => ({ change, label: settingLabel(change, display) })),
    preview(changes: unknown) {
      const result = previewPolicyChanges(snapshot, request, changes, { now, alternatives: false });
      if (!result.ok) return result;
      const { baseline, modified } = result.value;
      return {
        ok: true as const,
        value: {
          settings: result.value.changes.map((change) => ({
            label: settingLabel(change, display),
            from: displayValue(settingValue(snapshot, change)),
            to: displayValue(change.value),
          })),
          baseline: summarize(baseline),
          modified: summarize(modified),
        },
      };
    },
  };
}
