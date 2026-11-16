import { describe, expect, it } from "vitest";
import {
  PolicyPatchSchema,
  PolicyPreviewSchema,
  RangeRequestSchema,
  RangeExplanationSchema,
} from "../src/index.js";
import { blocked, meta, assignment, disabled, fact, alternative } from "./samples.js";

describe("policy and range contracts", () => {
  const changes = [{ entity: "policy", field: "minNoticeMin", value: 0 }];
  it("accepts only documented concrete setting changes", () => {
    for (const change of [
      ...changes,
      { entity: "policy", field: "maxAdvanceDays", value: 30 },
      { entity: "policy", field: "patientMaxBookingsPerDay", value: 2 },
      { entity: "service", id: "consult", field: "eligibility", value: "any" },
      { entity: "service", id: "consult", field: "bufferAfterMin", value: 0 },
      { entity: "service", id: "consult", field: "roomTurnoverMin", value: 0 },
      { entity: "practitioner", id: "doctor", field: "dailyCap", value: 7 },
    ])
      expect(PolicyPatchSchema.safeParse([change]).success).toBe(true);
    for (const change of [
      { path: "policy.minNoticeMin", value: 0 },
      { entity: "policy", field: "minNoticeMin", value: -1 },
      { entity: "policy", field: "minNoticeMin", value: 1.5 },
      { entity: "policy", field: "minNoticeMin", value: Infinity },
      { entity: "policy", field: "defaultDailyCap", value: 2 },
      { entity: "service", id: "consult", field: "eligibility", value: "referral_required" },
      { entity: "service", id: "consult", field: "requiredSkill", value: "other" },
      { entity: "practitioner", id: "doctor", field: "timeOff", value: [] },
    ])
      expect(PolicyPatchSchema.safeParse([change]).success).toBe(false);
    expect(PolicyPatchSchema.safeParse([...changes, ...changes]).success).toBe(false);
    expect(PolicyPatchSchema.safeParse([]).success).toBe(false);
  });
  it("accepts previews at one injected now with recursion disabled", () => {
    const preview = {
      changes,
      baseline: blocked,
      modified: { status: "bookable", assignment, meta },
    };
    expect(PolicyPreviewSchema.safeParse(preview).success).toBe(true);
    expect(
      PolicyPreviewSchema.safeParse({
        ...preview,
        modified: { ...preview.modified, meta: { ...meta, evaluatedAt: 1 } },
      }).success,
    ).toBe(false);
    const adminFix = { factIds: [fact.id], changes, viaCandidate: assignment, cost: 2 };
    expect(
      PolicyPreviewSchema.safeParse({ ...preview, baseline: { ...blocked, adminFix } }).success,
    ).toBe(false);
  });
  it("validates range requests and every result variant", () => {
    const request = { patientId: "patient", serviceId: "consult", fromDate: "2026-11-16", days: 7 };
    expect(RangeRequestSchema.safeParse(request).success).toBe(true);
    for (const days of [0, 8, 1.5])
      expect(RangeRequestSchema.safeParse({ ...request, days }).success).toBe(false);
    const available = {
      status: "has_availability",
      bookableCount: 1,
      commonCause: [],
      context: [],
      segments: [],
      facts: [],
      nextAvailable: null,
      nextSearch: disabled,
      meta,
    };
    expect(RangeExplanationSchema.safeParse(available).success).toBe(true);
    expect(RangeExplanationSchema.safeParse({ ...available, segments: [{}] }).success).toBe(false);
    expect(
      RangeExplanationSchema.safeParse({
        status: "invalid_request",
        errors: [{ code: "invalid_request", path: ["days"], message: "Invalid days" }],
      }).success,
    ).toBe(true);
  });
  it("retains actual fact references, ordered member starts and closed dates", () => {
    const range = {
      status: "fully_blocked",
      bookableCount: 0,
      commonCause: [fact.id],
      context: [],
      facts: [fact],
      segments: [
        {
          closedDay: false,
          date: "2026-11-16",
          from: 120,
          to: 150,
          memberStarts: [120, 135],
          factIds: [fact.id],
        },
      ],
      nextAvailable: null,
      nextSearch: disabled,
      meta,
    };
    expect(RangeExplanationSchema.safeParse(range).success).toBe(true);
    expect(
      RangeExplanationSchema.safeParse({ ...range, commonCause: ["min-notice:clinic-signature"] })
        .success,
    ).toBe(false);
    expect(
      RangeExplanationSchema.safeParse({
        ...range,
        segments: [{ ...range.segments[0], memberStarts: [135, 120] }],
      }).success,
    ).toBe(false);
    expect(
      RangeExplanationSchema.safeParse({
        ...range,
        segments: [{ closedDay: true, date: "2026-11-16", memberStarts: [], factIds: [fact.id] }],
      }).success,
    ).toBe(true);
    expect(RangeExplanationSchema.safeParse({ ...range, nextAvailable: alternative }).success).toBe(
      false,
    );
  });
});
