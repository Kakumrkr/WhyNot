import { DemoRoleSchema, demoPatientHeader, demoRoleHeader } from "@whynot/contracts/api";
import type { FastifyRequest } from "fastify";
import { ApiError, parseBody } from "./http.js";

export type DemoRole = { audience: "staff" } | { audience: "patient"; patientId: string };

/** Read client-controlled demo headers. Protected routes require an explicit role. */
export function demoRole(request: FastifyRequest): DemoRole {
  const audience = parseBody(DemoRoleSchema, request.headers[demoRoleHeader]);
  const patientId = request.headers[demoPatientHeader];
  if (audience === "staff") {
    if (patientId !== undefined) throw new ApiError("invalid_request");
    return { audience };
  }
  if (typeof patientId !== "string" || !/^[A-Za-z0-9._-]{1,128}$/u.test(patientId))
    throw new ApiError("invalid_request");
  return { audience, patientId };
}

/** Keep patient routes scoped to the selected fictional requester. */
export function requireRequester(request: FastifyRequest, patientId: string): DemoRole {
  const role = demoRole(request);
  if (role.audience === "patient" && role.patientId !== patientId) throw new ApiError("forbidden");
  return role;
}

/** Restrict demo administration to the fictional staff view. */
export function requireStaff(request: FastifyRequest): void {
  if (demoRole(request).audience !== "staff") throw new ApiError("forbidden");
}
