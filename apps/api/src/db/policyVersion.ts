import type { ClinicSnapshot } from "@whynot/contracts";
import type { policyVersions } from "./schema.js";

/** Serialize every policy-owned setting into one immutable version. */
export function policyVersion(snapshot: ClinicSnapshot): typeof policyVersions.$inferInsert {
  const { versionId, ...policy } = snapshot.policy;
  return {
    id: versionId,
    content: {
      policy,
      serviceSettings: Object.fromEntries(
        snapshot.services.map(({ id, bufferAfterMin, roomTurnoverMin, eligibility }) => [
          id,
          { bufferAfterMin, roomTurnoverMin, eligibility },
        ]),
      ),
      practitionerCaps: Object.fromEntries(
        snapshot.practitioners.flatMap(({ id, dailyCap }) =>
          dailyCap === undefined ? [] : [[id, dailyCap]],
        ),
      ),
    },
  };
}
