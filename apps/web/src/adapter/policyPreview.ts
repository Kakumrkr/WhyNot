import type {
  BookingRequest,
  ClinicSnapshot,
  PolicyChange,
  PolicyPatch,
  PolicyPreview,
  StaffEvaluation,
} from "@whynot/contracts";
import type { PolicyVersionContent } from "@whynot/contracts/api";
import { previewPolicyChanges, type TimeResult } from "@whynot/engine";
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

function settingValue(content: PolicyVersionContent, change: PolicyChange) {
  if (change.entity === "policy") return content.policy[change.field];
  if (change.entity === "practitioner")
    return content.practitionerCaps[change.id] ?? content.policy.defaultDailyCap;
  return content.serviceSettings[change.id]?.[change.field];
}

function displayValue(value: number | string | undefined) {
  if (value === undefined) return "No cap";
  if (value === "returning_only") return "Returning patients only";
  if (value === "any") return "Any patient";
  return String(value);
}

/** Label the proposed setting values without assuming the recorded policy was the same. */
export function describePolicyChanges(changes: PolicyPatch, display: TemplateDisplay) {
  return changes.map((change) => ({
    label: settingLabel(change, display),
    value: displayValue(change.value),
  }));
}

/** Describe the policy settings made available by either adapter. */
export function editableSettings(content: PolicyVersionContent, display: TemplateDisplay) {
  const settings: EditableSetting[] = [
    { entity: "policy", field: "minNoticeMin", value: content.policy.minNoticeMin },
    { entity: "policy", field: "maxAdvanceDays", value: content.policy.maxAdvanceDays },
    {
      entity: "policy",
      field: "patientMaxBookingsPerDay",
      value: content.policy.patientMaxBookingsPerDay,
    },
    ...[...(display.practitioners?.keys() ?? [])].map((id) => ({
      entity: "practitioner" as const,
      id,
      field: "dailyCap" as const,
      value: content.practitionerCaps[id] ?? content.policy.defaultDailyCap,
    })),
  ];
  for (const id of display.services?.keys() ?? []) {
    const service = content.serviceSettings[id];
    if (!service) continue;
    for (const field of ["bufferAfterMin", "roomTurnoverMin"] as const)
      settings.push({ entity: "service", id, field, value: service[field] });
    if (service.eligibility === "returning_only")
      settings.push({ entity: "service", id, field: "eligibility", value: "any" });
  }
  return settings.map((change) => ({ change, label: settingLabel(change, display) }));
}

/** Render a hypothetical comparison from the engine's before/after evaluations. */
export function renderPolicy(
  result: PolicyPreview,
  content: PolicyVersionContent,
  display: TemplateDisplay,
) {
  function summarize(evaluation: StaffEvaluation) {
    const { headline, primary } = TemplateNarrator.renderStaff(evaluation, display);
    const assignment = evaluation.status === "bookable" ? evaluation.assignment : null;
    return {
      headline,
      reasons: primary.sentences.map(({ text }) => text),
      assignment: assignment && {
        practitioner: display.practitioners?.get(assignment.practitionerId),
        room: display.rooms?.get(assignment.roomId) ?? assignment.roomId,
        equipment: assignment.equipmentId
          ? (display.equipment?.get(assignment.equipmentId) ?? assignment.equipmentId)
          : null,
      },
    };
  }

  return {
    settings: result.changes.map((change) => ({
      label: settingLabel(change, display),
      from: displayValue(settingValue(content, change)),
      to: displayValue(change.value),
    })),
    baseline: summarize(result.baseline),
    modified: summarize(result.modified),
  };
}

export type PolicyResult = TimeResult<ReturnType<typeof renderPolicy>>;
export type PolicyControls = {
  settings: ReturnType<typeof editableSettings>;
  preview: (changes: unknown) => PolicyResult | Promise<PolicyResult>;
};

/** Supply editable settings and compare the selected staff request in memory. */
export function policyPreview(
  snapshot: ClinicSnapshot,
  request: BookingRequest,
  now: number,
  display: TemplateDisplay,
): PolicyControls {
  const { policy, services, practitioners } = snapshot;
  const content: PolicyVersionContent = {
    policy,
    serviceSettings: Object.fromEntries(services.map((service) => [service.id, service])),
    practitionerCaps: Object.fromEntries(
      practitioners.flatMap(({ id, dailyCap }) => (dailyCap === undefined ? [] : [[id, dailyCap]])),
    ),
  };
  return {
    settings: editableSettings(content, display),
    preview(changes) {
      const result = previewPolicyChanges(snapshot, request, changes, { now, alternatives: false });
      return result.ok ? { ok: true, value: renderPolicy(result.value, content, display) } : result;
    },
  };
}
