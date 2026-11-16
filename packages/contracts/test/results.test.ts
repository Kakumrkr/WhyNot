import { describe, expect, it, expectTypeOf } from "vitest";
import {
  StaffEvaluationSchema,
  PatientEvaluationSchema,
  FactSchema,
  PublicFactSchema,
  RuleIdSchema,
  PublicRuleIdSchema,
  ExplanationSchema,
  AlternativeSchema,
  SearchReportSchema,
  type StaffEvaluation,
  type PatientEvaluation,
  type Fact,
  TraceSchema,
} from "../src/index.js";
import { blocked, patientBlocked, fact, assignment, meta, alternative } from "./samples.js";

describe("evaluation contracts", () => {
  it("validates self-contained traces even for bookable results", () => {
    const trace = {
      facts: [fact],
      candidates: [{ assignment, factIds: [fact.id] }],
      reducedRows: [[fact.id]],
      selected: [fact.id],
      searchNodes: 1,
      alternatives: [],
      candidatesTruncated: false,
      alternativesTruncated: false,
    };
    expect(
      StaffEvaluationSchema.safeParse({ status: "bookable", assignment, meta, trace }).success,
    ).toBe(true);
    expect(TraceSchema.safeParse({ ...trace, facts: [] }).success).toBe(false);
    expect(TraceSchema.safeParse({ ...trace, selected: ["unknown"] }).success).toBe(false);
    expect(TraceSchema.safeParse({ ...trace, reducedRows: [["unknown"]] }).success).toBe(false);
    expect(
      TraceSchema.safeParse({
        ...trace,
        candidates: Array.from({ length: 501 }, () => ({ assignment, factIds: [] })),
      }).success,
    ).toBe(false);
  });
  it("accepts populated alternatives/admin fixes and rejects dangling fix references", () => {
    const adminFix = {
      factIds: [fact.id],
      changes: [{ entity: "policy", field: "minNoticeMin", value: 60 }],
      viaCandidate: assignment,
      cost: 2,
    };
    const result = {
      ...blocked,
      adminFix,
      alternatives: [alternative],
      search: { status: "complete", from: 0, to: 1440, evaluated: 10 },
    };
    expect(StaffEvaluationSchema.safeParse(result).success).toBe(true);
    expect(
      StaffEvaluationSchema.safeParse({
        ...result,
        adminFix: { ...adminFix, factIds: ["unknown"] },
      }).success,
    ).toBe(false);
  });
  it("has exactly 23 unique internal rule IDs and separate public replacements", () => {
    expect(RuleIdSchema.options).toHaveLength(23);
    expect(new Set(RuleIdSchema.options).size).toBe(23);
    for (const id of ["practitioner-unavailable", "resource-unavailable"]) {
      expect(RuleIdSchema.safeParse(id).success).toBe(false);
      expect(PublicRuleIdSchema.safeParse(id).success).toBe(true);
    }
    for (const id of [
      "practitioner-time-off",
      "practitioner-break",
      "room-capability",
      "equipment-type",
    ])
      expect(PublicRuleIdSchema.safeParse(id).success).toBe(false);
  });
  it("accepts each staff and patient result variant and infers distinct types", () => {
    const staff = [
      blocked,
      { status: "bookable", assignment, meta },
      {
        status: "invalid_request",
        errors: [{ code: "off_grid", path: ["start"], message: "Off grid" }],
      },
    ];
    const patient = [
      patientBlocked,
      { status: "bookable", assignment: { practitionerId: "doctor", start: 120, end: 135 }, meta },
      { status: "invalid_request", errors: [{ code: "off_grid", field: "start" }] },
    ];
    staff.forEach((value) => expect(StaffEvaluationSchema.safeParse(value).success).toBe(true));
    patient.forEach((value) => expect(PatientEvaluationSchema.safeParse(value).success).toBe(true));
    expectTypeOf(StaffEvaluationSchema.parse(blocked)).toEqualTypeOf<StaffEvaluation>();
    expectTypeOf(PatientEvaluationSchema.parse(patientBlocked)).toEqualTypeOf<PatientEvaluation>();
    expect(StaffEvaluationSchema.safeParse({ status: "invalid_request", errors: [] }).success).toBe(
      false,
    );
    expect(PatientEvaluationSchema.safeParse(blocked).success).toBe(false);
  });
  it("rejects unknown fields at every patient boundary", () => {
    for (const key of ["adminFix", "trace", "perCandidateSummary", "request", "patientId"]) {
      expect(PatientEvaluationSchema.safeParse({ ...patientBlocked, [key]: null }).success).toBe(
        false,
      );
    }
    for (const key of ["optimal", "perCandidateSummary"]) {
      expect(
        PatientEvaluationSchema.safeParse({
          ...patientBlocked,
          explanation: { ...patientBlocked.explanation, [key]: [] },
        }).success,
      ).toBe(false);
    }
    for (const params of [
      { bookingId: "secret" },
      { reason: "leave reason" },
      { patientId: "other" },
      { serviceId: "private" },
    ]) {
      expect(
        PublicFactSchema.safeParse({ id: "fact-1", ruleId: "practitioner-busy", params }).success,
      ).toBe(false);
    }
    expect(
      PublicFactSchema.safeParse({ id: "fact-1", ruleId: "practitioner-unavailable", params: {} })
        .success,
    ).toBe(true);
    expect(
      PublicFactSchema.safeParse({ id: "booking-secret", ruleId: "practitioner-busy", params: {} })
        .success,
    ).toBe(false);
    expect(
      PatientEvaluationSchema.safeParse({
        status: "invalid_request",
        errors: [{ code: "invalid_request", field: "start", message: "staff details" }],
      }).success,
    ).toBe(false);
  });
  it("validates rule-specific fact parameters and all explanation references", () => {
    expectTypeOf<Extract<Fact, { ruleId: "min-notice" }>["params"]>().toEqualTypeOf<{
      requiredMin: number;
      actualMin: number;
    }>();
    expect(FactSchema.safeParse(fact).success).toBe(true);
    expect(FactSchema.safeParse({ ...fact, params: { bookingId: "wrong" } }).success).toBe(false);
    expect(
      ExplanationSchema.safeParse({ ...blocked.explanation, primary: ["unknown"] }).success,
    ).toBe(false);
    expect(
      ExplanationSchema.safeParse({ ...blocked.explanation, facts: [fact, fact] }).success,
    ).toBe(false);
    expect(
      ExplanationSchema.safeParse({
        ...blocked.explanation,
        groups: [{ id: "group", kind: "request", factIds: ["unknown"] }],
      }).success,
    ).toBe(false);
    expect(
      ExplanationSchema.safeParse({
        ...blocked.explanation,
        perCandidateSummary: [
          { practitionerId: "doctor", candidate: assignment, factIds: ["unknown"] },
        ],
      }).success,
    ).toBe(false);
    expect(
      PatientEvaluationSchema.safeParse({
        ...patientBlocked,
        explanation: { ...patientBlocked.explanation, primary: ["fact-2"] },
      }).success,
    ).toBe(false);
  });
  it("accepts structural missing-resource explanations without invented assignments", () => {
    const structural = {
      ...blocked,
      explanation: {
        ...blocked.explanation,
        basis: "missing_resource",
        groups: [],
        facts: [
          {
            ...fact,
            ruleId: "resource-missing",
            kind: "capability",
            params: { dimension: "room" },
            relaxableBy: [],
          },
        ],
      },
    };
    expect(StaffEvaluationSchema.safeParse(structural).success).toBe(true);
    expect(
      StaffEvaluationSchema.safeParse({
        ...structural,
        explanation: { ...structural.explanation, optimal: false },
      }).success,
    ).toBe(false);
    expect(
      StaffEvaluationSchema.safeParse({
        ...structural,
        alternatives: [alternative],
        search: { status: "complete", from: 0, to: 1000, evaluated: 1 },
      }).success,
    ).toBe(false);
  });
  it("validates alternative assignments and truthful disabled search fields", () => {
    expect(AlternativeSchema.safeParse(alternative).success).toBe(true);
    expect(AlternativeSchema.safeParse({ ...alternative, assignment }).success).toBe(false);
    expect(
      StaffEvaluationSchema.safeParse({ ...blocked, alternatives: [alternative] }).success,
    ).toBe(false);
    for (const status of ["complete", "budget_exhausted", "window_limited"]) {
      expect(
        SearchReportSchema.safeParse({ status, from: 0, to: 1440, evaluated: 2 }).success,
      ).toBe(true);
      expect(SearchReportSchema.safeParse({ status, from: 1, to: 0, evaluated: 2 }).success).toBe(
        false,
      );
    }
    expect(
      SearchReportSchema.safeParse({ status: "disabled", from: 0, to: 1440, evaluated: 0 }).success,
    ).toBe(false);
    expect(
      StaffEvaluationSchema.safeParse({ ...blocked, meta: { ...meta, timingsMs: 1 } }).success,
    ).toBe(false);
  });
});
