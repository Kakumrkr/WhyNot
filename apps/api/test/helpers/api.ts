import type { BookingRequest } from "@whynot/contracts";
import { formatOffsetInstant } from "@whynot/engine";

export const staff = { "x-demo-role": "staff" };

export function patient(patientId = "patient-test") {
  return { "x-demo-role": "patient", "x-demo-patient-id": patientId };
}

export function wireSlot(request: BookingRequest) {
  const start = formatOffsetInstant(request.start, "UTC");
  if (!start.ok) throw new Error("Invalid test instant");
  return { ...request, start: start.value };
}
