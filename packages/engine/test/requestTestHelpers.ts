import type { Booking } from "@whynot/contracts";
import { buildMinimalRequest, buildMinimalSnapshot, demoNow } from "../../fixtures/src/index.js";
import { parseOffsetInstant } from "../src/time.js";
import { validateRequest, type RuleContext } from "../src/validateRequest.js";
export function context(
  snapshot = buildMinimalSnapshot(),
  request = buildMinimalRequest(),
  now = demoNow,
): RuleContext {
  const result = validateRequest(snapshot, request, { now });
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
}
export function instant(iso: string): number {
  const result = parseOffsetInstant(iso);
  if (!result.ok) throw new Error("Invalid test timestamp");
  return result.value;
}
export function booking(start: number, overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-test",
    patientId: "patient-test",
    serviceId: "consult",
    practitionerId: "practitioner-test",
    roomId: "room-test",
    start,
    end: start + 15,
    status: "confirmed",
    ...overrides,
  };
}
