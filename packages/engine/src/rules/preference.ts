import type { Fact } from "@whynot/contracts";
import { makeFact } from "../factId.js";
import type { RuleContext } from "../validateRequest.js";

/** One request-grounded fact is shared by every candidate using another practitioner. */
export function checkPreference({ request }: RuleContext, practitionerId: string): Fact[] {
  return request.practitionerId === undefined || request.practitionerId === practitionerId
    ? []
    : [
        makeFact(
          "request-practitioner",
          { type: "request", id: request.practitionerId },
          { practitionerId: request.practitionerId },
        ),
      ];
}
