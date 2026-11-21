import {
  ApiErrorSchema,
  apiResults,
  type ApiBookingRequest,
  type ApiErrorCode,
} from "@whynot/contracts/api";
import { formatOffsetInstant, parseOffsetInstant } from "@whynot/engine";

const errors = {
  invalid_request: [400, "Request is invalid."],
  forbidden: [403, "The demo role cannot perform this action."],
  not_found: [404, "The requested resource was not found."],
  payload_too_large: [413, "The request body exceeds the size limit."],
  unsupported_media_type: [415, "Use application/json for the request body."],
  rate_limited: [429, "Too many requests. Try again shortly."],
  booking_conflict: [409, "The engine could not book the requested appointment."],
  contended: [409, "The operation encountered concurrent changes. Try again."],
  unsupported_version: [409, "The version required to replay this evaluation is unavailable."],
  incomplete_evidence: [409, "The stored evidence is insufficient to replay this evaluation."],
  internal_error: [500, "An internal error occurred."],
} as const satisfies Record<ApiErrorCode, readonly [number, string]>;

export class ApiError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(errors[code][1]);
  }
}

/** Use fixed messages for every transport error, independent of user input. */
export function apiError(code: ApiErrorCode) {
  const [status, message] = errors[code];
  return { status, body: ApiErrorSchema.parse({ error: { code, message } }) };
}

/** Validate strict request schemas without returning parser diagnostics to callers. */
export function parseBody<T>(
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false } },
  input: unknown,
): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new ApiError("invalid_request");
  return parsed.data;
}

/** Format an engine instant for transmission, defaulting to canonical UTC. */
export function isoInstant(minute: number, zone = "UTC"): string {
  const instant = formatOffsetInstant(minute, zone);
  if (!instant.ok) throw new Error("Cannot serialize appointment instant");
  return instant.value;
}

/** Use the engine's minute-precision parser for accepted explicit-offset slot inputs. */
export function slotRequest(input: ApiBookingRequest) {
  const start = parseOffsetInstant(input.start);
  if (!start.ok) throw new ApiError("invalid_request");
  return { ...input, start: start.value };
}

export const results = apiResults({
  format: isoInstant,
  parse: (value) => {
    const instant = parseOffsetInstant(value);
    return instant.ok ? instant.value : undefined;
  },
});
