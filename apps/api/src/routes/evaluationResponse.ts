import type { RangeExplanation, StaffEvaluation } from "@whynot/contracts";
import type { ApiErrorCode } from "@whynot/contracts/api";
import { projectForAudience } from "@whynot/engine";
import type { FastifyReply } from "fastify";
import type { DemoRole } from "../demoRole.js";
import { apiError, results } from "../http.js";

/** Return a slot decision or a scoped error with the applicable audience's evidence. */
export function sendSlot(
  reply: FastifyReply,
  result: StaffEvaluation,
  role: DemoRole,
  code?: ApiErrorCode,
) {
  const failure = code ?? (result.status === "invalid_request" ? "invalid_request" : undefined);
  const error = failure === undefined ? undefined : apiError(failure);
  if (role.audience === "patient") {
    const evaluation = projectForAudience(result, "patient", {
      requesterPatientId: role.patientId,
    });
    return error === undefined
      ? reply.send(results.patientSlot.encode(evaluation))
      : reply.code(error.status).send(
          results.patientSlotError.encode({
            error: { ...error.body.error, details: { evaluation } },
          }),
        );
  }
  return error === undefined
    ? reply.send(results.staffSlot.encode(result))
    : reply.code(error.status).send(
        results.staffSlotError.encode({
          error: { ...error.body.error, details: { evaluation: result } },
        }),
      );
}

/** Return a range decision using only the schema and evidence for the selected audience. */
export function sendRange(reply: FastifyReply, result: RangeExplanation, role: DemoRole) {
  const error = result.status === "invalid_request" ? apiError("invalid_request") : undefined;
  if (role.audience === "patient") {
    const evaluation = projectForAudience(result, "patient", {
      requesterPatientId: role.patientId,
    });
    return error === undefined
      ? reply.send(results.patientRange.encode(evaluation))
      : reply.code(error.status).send(
          results.patientRangeError.encode({
            error: { ...error.body.error, details: { evaluation } },
          }),
        );
  }
  return error === undefined
    ? reply.send(results.staffRange.encode(result))
    : reply.code(error.status).send(
        results.staffRangeError.encode({
          error: { ...error.body.error, details: { evaluation: result } },
        }),
      );
}
