import type { Rule, RuleId } from "@whynot/contracts";

/** Version of the rule catalog shipped with this engine build. */
export const catalogVersion = 1;

function rule(
  id: RuleId,
  family: Rule["family"],
  weight: number,
  visibility: Rule["visibility"] = "public",
  relaxableBy: Rule["relaxableBy"] = ["patient"],
): Rule {
  Object.freeze(relaxableBy);
  return Object.freeze({ id, version: 1, family, weight, visibility, relaxableBy });
}

/** Internal catalog v1; presentation replacement rules are deliberately excluded. */
export const catalog: Readonly<Record<RuleId, Rule>> = Object.freeze({
  "clinic-closed-day": rule("clinic-closed-day", "availability", 1),
  "clinic-hours": rule("clinic-hours", "availability", 2),
  "min-notice": rule("min-notice", "timing-policy", 2, "public", ["patient", "admin"]),
  "max-advance": rule("max-advance", "timing-policy", 2, "public", ["patient", "admin"]),
  "patient-eligibility-returning": rule("patient-eligibility-returning", "patient", 1, "public", [
    "admin",
  ]),
  "patient-eligibility-referral": rule("patient-eligibility-referral", "patient", 1, "public", []),
  "patient-daily-limit": rule("patient-daily-limit", "patient", 2, "public", ["patient", "admin"]),
  "request-practitioner": rule("request-practitioner", "preference", 4),
  "practitioner-skill": rule("practitioner-skill", "capability", 5, "public", []),
  "practitioner-hours": rule("practitioner-hours", "availability", 3),
  "practitioner-break": rule("practitioner-break", "availability", 3),
  "practitioner-time-off": rule("practitioner-time-off", "availability", 3, "staff"),
  "practitioner-busy": rule("practitioner-busy", "occupancy", 3),
  "practitioner-buffer": rule("practitioner-buffer", "occupancy", 3, "public", [
    "patient",
    "admin",
  ]),
  "practitioner-daily-cap": rule("practitioner-daily-cap", "policy", 3, "public", [
    "patient",
    "admin",
  ]),
  "room-capability": rule("room-capability", "capability", 6, "staff", []),
  "room-maintenance": rule("room-maintenance", "availability", 4),
  "room-busy": rule("room-busy", "occupancy", 4),
  "room-turnover": rule("room-turnover", "occupancy", 4, "public", ["patient", "admin"]),
  "equipment-type": rule("equipment-type", "capability", 6, "staff", []),
  "equipment-maintenance": rule("equipment-maintenance", "availability", 4),
  "equipment-busy": rule("equipment-busy", "occupancy", 4),
  "resource-missing": rule("resource-missing", "capability", 1, "public", []),
});
