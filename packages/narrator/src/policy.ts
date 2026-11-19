import type { PolicyChange } from "@whynot/contracts";
import { duration, type Format } from "./format.js";

/** Describe the concrete setting and value supplied by the engine. */
export function policySetting(change: PolicyChange, format: Format): string {
  switch (change.field) {
    case "minNoticeMin":
      return `Set the clinic's minimum notice to ${duration(change.value)}.`;
    case "maxAdvanceDays":
      return `Set the clinic's advance booking window to ${change.value} ${change.value === 1 ? "day" : "days"}.`;
    case "patientMaxBookingsPerDay":
      return `Set the clinic's daily booking limit per patient to ${change.value}.`;
    case "dailyCap":
      return `Set ${format.staffPractitioner(change.id)}'s daily appointment cap to ${change.value}.`;
    case "bufferAfterMin":
      return `Set the after-appointment buffer for ${format.staffService(change.id)} to ${duration(change.value)}.`;
    case "roomTurnoverMin":
      return `Set room turnover for ${format.staffService(change.id)} to ${duration(change.value)}.`;
    case "eligibility":
      return `Set ${format.staffService(change.id)} eligibility to allow new and returning patients.`;
  }
}
