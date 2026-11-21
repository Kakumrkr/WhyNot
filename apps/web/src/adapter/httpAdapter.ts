import type { BookingRequest, RangeRequest } from "@whynot/contracts";
import {
  ApiBookingRequestSchema,
  ApiErrorSchema,
  AvailabilityQuerySchema,
  AvailabilityResponseSchema,
  BookingParamsSchema,
  BookingResponseSchema,
  CancellationResponseSchema,
  ClinicResponseSchema,
  ExplainBodySchema,
  ExplainRangeBodySchema,
  PolicyBodySchema,
  PolicyListResponseSchema,
  ResetResponseSchema,
  apiResults,
  demoPatientHeader,
  demoRoleHeader,
  type ApiErrorCode,
  type DemoRole,
} from "@whynot/contracts/api";
import { formatOffsetInstant, parseOffsetInstant } from "@whynot/engine";
import type { TemplateDisplay } from "@whynot/narrator";
import { renderRange } from "./calendarRange.js";
import { renderSlot } from "./renderSlot.js";
import { baseScenario, timeValue } from "./requestSelection.js";

type Parser<T> = { parse: (input: unknown) => T };
type Requester = { audience: DemoRole; patientId: string };
type EvaluationError<T> = {
  error: { code: ApiErrorCode; details?: { evaluation: T } | undefined };
};

function instant(minute: number) {
  return timeValue(formatOffsetInstant(minute, "UTC"));
}

function slotBody(request: BookingRequest) {
  return ApiBookingRequestSchema.parse({ ...request, start: instant(request.start) });
}

const results = apiResults({
  format: instant,
  parse: (input) => {
    const parsed = parseOffsetInstant(input);
    return parsed.ok ? parsed.value : undefined;
  },
});

export class HttpError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
  }
}

async function read(path: string, options: RequestInit) {
  const response = await fetch(path, { ...options, cache: "no-store" });
  const body: unknown = await response.json();
  return { status: response.status, body };
}

function decode<T>(response: Awaited<ReturnType<typeof read>>, schema: Parser<T>, status = 200) {
  if (response.status === status) return schema.parse(response.body);
  throw new HttpError(ApiErrorSchema.parse(response.body).error.code);
}

function decodeEvaluation<T extends { status: string }>(
  response: Awaited<ReturnType<typeof read>>,
  schema: Parser<T>,
  errorSchema: Parser<EvaluationError<T>>,
) {
  if (response.status === 400) {
    const { error } = errorSchema.parse(response.body);
    const evaluation = error.details?.evaluation;
    if (error.code === "invalid_request" && evaluation?.status === "invalid_request")
      return evaluation;
    throw new HttpError(error.code);
  }
  const evaluation = decode(response, schema);
  if (evaluation.status === "invalid_request") throw new Error("Unexpected evaluation status");
  return evaluation;
}

/** Map the selected local scope to its typed, audience-aware HTTP operations. */
export function httpAdapter(scope: string) {
  const base = scope === baseScenario.id ? "/api" : `/api/demo/${encodeURIComponent(scope)}`;
  function send(
    path: string,
    requester?: Requester,
    method = "GET",
    body?: object,
    signal?: AbortSignal,
  ) {
    const headers = new Headers();
    if (requester) {
      headers.set(demoRoleHeader, requester.audience);
      if (requester.audience === "patient") headers.set(demoPatientHeader, requester.patientId);
    }
    if (body !== undefined) headers.set("content-type", "application/json");
    return read(`${base}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal === undefined ? {} : { signal }),
    });
  }

  return {
    async clinic(signal?: AbortSignal) {
      return decode(
        await send("/clinic", undefined, "GET", undefined, signal),
        ClinicResponseSchema,
      );
    },
    async availability(
      date: string,
      request: Omit<BookingRequest, "start">,
      requester: Requester,
      signal: AbortSignal,
    ) {
      const { practitionerId, ...required } = AvailabilityQuerySchema.parse({ ...request, date });
      const query = new URLSearchParams(required);
      if (practitionerId !== undefined) query.set("practitionerId", practitionerId);
      const value = decode(
        await send(`/availability?${query}`, requester, "GET", undefined, signal),
        AvailabilityResponseSchema,
      );
      if (value.date !== date) throw new Error("Unexpected availability date");
      return value.starts.map(({ start, ...slot }) => ({
        ...slot,
        start: timeValue(parseOffsetInstant(start)),
      }));
    },
    async evaluate(
      request: BookingRequest,
      requester: Requester,
      display: TemplateDisplay,
      signal: AbortSignal,
    ) {
      const staff = requester.audience === "staff";
      const body = ExplainBodySchema.parse({
        request: slotBody(request),
        options: { trace: staff, includeAdminFix: staff },
      });
      const response = await send("/explain", requester, "POST", body, signal);
      return renderSlot(
        staff
          ? {
              audience: "staff",
              result: decodeEvaluation(response, results.staffSlot, results.staffSlotError),
            }
          : {
              audience: "patient",
              result: decodeEvaluation(response, results.patientSlot, results.patientSlotError),
            },
        request,
        display,
      );
    },
    async explainRange(
      request: RangeRequest,
      requester: Requester,
      display: TemplateDisplay,
      signal: AbortSignal,
    ) {
      const body = ExplainRangeBodySchema.parse({ request });
      const response = await send("/explain-range", requester, "POST", body, signal);
      return renderRange(
        requester.audience === "staff"
          ? {
              audience: "staff",
              result: decodeEvaluation(response, results.staffRange, results.staffRangeError),
            }
          : {
              audience: "patient",
              result: decodeEvaluation(response, results.patientRange, results.patientRangeError),
            },
        request,
        display,
      );
    },
    async policyVersions(requester: Requester, signal?: AbortSignal) {
      return decode(
        await send("/admin/policies", requester, "GET", undefined, signal),
        PolicyListResponseSchema,
      );
    },
    async previewPolicy(request: BookingRequest, changes: unknown, requester: Requester) {
      const body = PolicyBodySchema.parse({ request: slotBody(request), changes });
      return decode(await send("/admin/policies/preview", requester, "POST", body), results.policy);
    },
    async book(request: BookingRequest, requester: Requester, display: TemplateDisplay) {
      const response = await send("/bookings", requester, "POST", slotBody(request));
      if (response.status !== 409) {
        const booking = decode(response, BookingResponseSchema, 201);
        if (
          timeValue(parseOffsetInstant(booking.start)) !== request.start ||
          timeValue(parseOffsetInstant(booking.end)) <= request.start ||
          (request.practitionerId !== undefined &&
            booking.practitionerId !== request.practitionerId)
        )
          throw new Error("Booking response did not match the request");
        return { status: "confirmed" as const, booking };
      }
      const conflict =
        requester.audience === "staff"
          ? readConflict(
              results.staffSlotError,
              (result) => renderSlot({ audience: "staff", result }, request, display),
              response.body,
            )
          : readConflict(
              results.patientSlotError,
              (result) => renderSlot({ audience: "patient", result }, request, display),
              response.body,
            );
      return { status: "conflict" as const, ...conflict };
    },
    async cancel(id: string, requester: Requester) {
      const params = BookingParamsSchema.parse({ id });
      return decode(
        await send(`/bookings/${encodeURIComponent(params.id)}`, requester, "DELETE"),
        CancellationResponseSchema,
      );
    },
    async reset(requester: Requester) {
      return decode(await send("/demo/reset", requester, "POST"), ResetResponseSchema);
    },
  };
}

function readConflict<T extends { status: string }>(
  schema: Parser<EvaluationError<T>>,
  render: (value: T) => ReturnType<typeof renderSlot>,
  body: unknown,
) {
  const {
    error: { code, details },
  } = schema.parse(body);
  const evaluation = details?.evaluation;
  if (
    (code !== "booking_conflict" && code !== "contended") ||
    (code === "booking_conflict" && evaluation?.status !== "blocked")
  )
    throw new Error("Unexpected booking conflict");
  return { code, check: evaluation ? render(evaluation) : undefined };
}

export type HttpAdapter = ReturnType<typeof httpAdapter>;
export type ClinicConfig = Awaited<ReturnType<HttpAdapter["clinic"]>>;
export type BookingReceipt = Extract<
  Awaited<ReturnType<HttpAdapter["book"]>>,
  { status: "confirmed" }
>["booking"];
