import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import {
  addElapsedDays,
  addLocalDays,
  addMinutes,
  datedSchedule,
  formatOffsetInstant,
  gridStarts,
  intervalContains,
  intervalsOverlap,
  isOnLocalGrid,
  localDate,
  localDateDifference,
  localMinuteOfDay,
  parseOffsetInstant,
  resolveRecurringBoundary,
  splitOvernightHours,
  type TimeResult,
} from "../src/time.js";

function value<T>(result: TimeResult<T>): T {
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
}
const instant = (iso: string) => value(parseOffsetInstant(iso));
const london = "Europe/London";
const kolkata = "Asia/Kolkata";

describe("explicit instants and minute arithmetic", () => {
  it("normalizes offsets, epoch and pre-epoch instants without rounding", () => {
    expect(instant("1970-01-01T00:00:00Z")).toBe(0);
    expect(instant("1969-12-31T23:59:00Z")).toBe(-1);
    expect(instant("1970-01-01T05:30:00+05:30")).toBe(0);
    expect(value(formatOffsetInstant(0, kolkata))).toBe("1970-01-01T05:30:00+05:30");
    for (const input of [
      "2026-03-29T01:30:00",
      "2026-02-30T00:00:00Z",
      "2026-01-01T00:00:01Z",
      "2026-01-01T00:00:00.000Z",
    ])
      expect(parseOffsetInstant(input).ok).toBe(false);
    for (const minute of [NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER])
      expect(formatOffsetInstant(minute, london).ok).toBe(false);
    expect(formatOffsetInstant(0, "not/a/zone").ok).toBe(false);
    expect(formatOffsetInstant(instant("1800-01-01T00:00:00Z"), london)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: "unsupported_wall_time" })],
    });
    expect(resolveRecurringBoundary("1800-01-01", "12:00", london)).toEqual({
      ok: false,
      issues: [expect.objectContaining({ code: "unsupported_wall_time" })],
    });
  });

  it("uses exact elapsed notice and advance boundaries across DST", () => {
    const now = instant("2026-03-28T12:00:00Z");
    expect(value(addMinutes(now, 120)) - now).toBe(120);
    expect(value(addMinutes(now, 119)) - now).toBe(119);
    const advance = value(addElapsedDays(now, 1));
    expect(advance - now).toBe(1440);
    expect(value(formatOffsetInstant(advance, london))).toBe("2026-03-29T13:00:00+01:00");
    expect(value(addMinutes(advance, 1)) - now).toBe(1441);
    expect(addMinutes(Number.MAX_SAFE_INTEGER, 1).ok).toBe(false);
    expect(addMinutes(1.5, 1).ok).toBe(false);
    expect(addElapsedDays(0, Number.MAX_SAFE_INTEGER).ok).toBe(false);
    expect(addElapsedDays(0, 0.5).ok).toBe(false);
  });

  it("round-trips generated minute instants through explicit offsets", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -20000000, max: 50000000 }),
        fc.constantFrom(london, kolkata),
        (minute, zone) => {
          expect(instant(value(formatOffsetInstant(minute, zone)))).toBe(minute);
        },
      ),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  });
});

describe("local dates and recurring boundaries", () => {
  it("uses calendar arithmetic at midnight, month/year/leap boundaries", () => {
    expect(value(localDate(instant("2026-11-15T23:00:00-02:00"), london))).toBe("2026-11-16");
    expect(value(localDate(instant("2026-11-15T20:00:00Z"), kolkata))).toBe("2026-11-16");
    expect(value(addLocalDays("2024-02-28", 1))).toBe("2024-02-29");
    expect(value(addLocalDays("2026-12-31", 1))).toBe("2027-01-01");
    expect(value(addLocalDays("2026-01-01", -1))).toBe("2025-12-31");
    expect(value(localDateDifference("2026-03-28", "2026-03-30"))).toBe(2);
    expect(value(localDateDifference("2026-10-26", "2026-10-24"))).toBe(-2);
    expect(addLocalDays("2026-02-29", 1).ok).toBe(false);
    expect(addLocalDays("2026-01-01", Infinity).ok).toBe(false);
    expect(localDateDifference("bad", "2026-01-01").ok).toBe(false);
  });

  it("rejects recurring London folds/gaps, but explicit offsets select either fold", () => {
    for (const date of ["2026-03-29", "2026-10-25"]) {
      expect(resolveRecurringBoundary(date, "01:30", london)).toEqual({
        ok: false,
        issues: [
          expect.objectContaining({ code: "unsupported_wall_time", path: ["date", date, "01:30"] }),
        ],
      });
    }
    const first = instant("2026-10-25T01:30:00+01:00");
    const second = instant("2026-10-25T01:30:00+00:00");
    expect(second - first).toBe(60);
    for (const minute of [first, second]) {
      expect(value(localMinuteOfDay(minute, london))).toBe(90);
      expect(value(isOnLocalGrid(minute, london, 15))).toBe(true);
    }
    expect(value(resolveRecurringBoundary("2026-03-29", "01:30", kolkata))).toBe(
      instant("2026-03-29T01:30:00+05:30"),
    );
    expect(resolveRecurringBoundary("2026-01-01", "24:00", london).ok).toBe(false);
    expect(resolveRecurringBoundary("2026-01-01", "25:00", london, true).ok).toBe(false);
  });

  it("resolves 24:00 by next local date, yielding 23/25-hour full days", () => {
    const schedule = Object.freeze([{ weekday: 7, from: "00:00", to: "24:00" }]);
    for (const [date, duration] of [
      ["2026-03-29", 1380],
      ["2026-10-25", 1500],
    ] as const) {
      const interval = value(datedSchedule([...schedule], date, london))[0];
      expect(interval).toEqual({
        from: value(resolveRecurringBoundary(date, "00:00", london)),
        to: value(resolveRecurringBoundary(value(addLocalDays(date, 1)), "00:00", london)),
      });
      expect(interval?.to).toBe((interval?.from ?? 0) + duration);
    }
    expect(value(datedSchedule([...schedule], "2026-03-29", kolkata))[0]).toEqual({
      from: instant("2026-03-29T00:00:00+05:30"),
      to: instant("2026-03-30T00:00:00+05:30"),
    });
    expect(value(datedSchedule([...schedule], "2026-03-30", london))).toEqual([]);
    expect(
      datedSchedule([{ weekday: 7, from: "01:30", to: "03:00" }], "2026-03-29", london).ok,
    ).toBe(false);
    expect(
      datedSchedule([{ weekday: 7, from: "00:00", to: "01:30" }], "2026-10-25", london).ok,
    ).toBe(false);
    expect(datedSchedule([], "2026-03-29", "bad").ok).toBe(false);
  });

  it("splits overnight hours at midnight, wrapping Sunday to Monday", () => {
    const split = value(splitOvernightHours(7, "23:00", "01:00"));
    expect(split).toEqual([
      { weekday: 7, from: "23:00", to: "24:00" },
      { weekday: 1, from: "00:00", to: "01:00" },
    ]);
    expect(value(datedSchedule(split, "2026-11-15", london))).toEqual([
      { from: instant("2026-11-15T23:00:00Z"), to: instant("2026-11-16T00:00:00Z") },
    ]);
    expect(value(splitOvernightHours(7, "23:00", "00:00"))).toEqual([
      { weekday: 7, from: "23:00", to: "24:00" },
    ]);
    expect(value(splitOvernightHours(1, "00:00", "24:00"))).toEqual([
      { weekday: 1, from: "00:00", to: "24:00" },
    ]);
    expect(splitOvernightHours(1, "24:00", "01:00").ok).toBe(false);
    expect(splitOvernightHours(1, "01:00", "01:00").ok).toBe(false);
  });
});

describe("local grids and half-open intervals", () => {
  it("aligns Kolkata starts to local midnight, independently of duration", () => {
    const start = instant("2026-11-16T08:00:00+05:30");
    expect(start % 60).toBe(30);
    expect(value(isOnLocalGrid(start, kolkata, 60))).toBe(true);
    expect(value(isOnLocalGrid(start + 30, kolkata, 60))).toBe(false);
    expect(value(isOnLocalGrid(start, kolkata, 15))).toBe(true);
    expect(value(addMinutes(start, 10))).toBe(start + 10);
    for (const grid of [0, -1, 0.5, Infinity])
      expect(isOnLocalGrid(start, kolkata, grid).ok).toBe(false);
  });

  it("enumerates real fold/gap instants using wall grid alignment", () => {
    const spring = value(gridStarts("2026-03-29", london, 15));
    const autumn = value(gridStarts("2026-10-25", london, 15));
    expect(spring).toHaveLength(92);
    expect(autumn).toHaveLength(100);
    expect(value(gridStarts("2026-03-29", kolkata, 15))).toHaveLength(96);
    expect(spring).toContain(instant("2026-03-29T02:00:00+01:00"));
    expect(autumn).toContain(instant("2026-10-25T01:30:00+01:00"));
    expect(autumn).toContain(instant("2026-10-25T01:30:00Z"));
    const oddGrid = value(gridStarts("2026-10-25", london, 45));
    expect(oddGrid).toContain(instant("2026-10-25T01:30:00Z"));
    expect(oddGrid).not.toContain(instant("2026-10-25T01:15:00Z"));
    expect(new Set(autumn).size).toBe(autumn.length);
    expect(gridStarts("bad", london, 15).ok).toBe(false);
    expect(gridStarts("1900-01-02", "Europe/Paris", 15)).toMatchObject({
      ok: false,
      issues: [{ code: "unsupported_wall_time" }],
    });
    expect(gridStarts("2026-03-29", london, 0).ok).toBe(false);
  });

  it("enumerates the actual grid when midnight itself is skipped", () => {
    const zone = "America/Sao_Paulo";
    const date = "2018-11-04";
    expect(resolveRecurringBoundary(date, "00:00", zone).ok).toBe(false);
    const starts = value(gridStarts(date, zone, 15));
    expect(starts).toHaveLength(92);
    expect(starts[0]).toBe(instant("2018-11-04T01:00:00-02:00"));
    expect(starts.at(-1)).toBe(instant("2018-11-04T23:45:00-02:00"));
  });

  it("accepts exact closing and break adjacency, including midnight spans", () => {
    const hours = { from: 0, to: 600 };
    expect(intervalContains(hours, { from: 590, to: 600 })).toBe(true);
    expect(intervalContains(hours, { from: 590, to: 601 })).toBe(false);
    const lunch = { from: 300, to: 345 };
    expect(intervalsOverlap(lunch, { from: 290, to: 300 })).toBe(false);
    expect(intervalsOverlap(lunch, { from: 345, to: 355 })).toBe(false);
    expect(intervalsOverlap(lunch, { from: 299, to: 301 })).toBe(true);
    const midnight = instant("2026-11-16T00:00:00Z");
    expect(
      intervalsOverlap(
        { from: midnight - 20, to: midnight + 20 },
        { from: midnight, to: midnight + 10 },
      ),
    ).toBe(true);
  });

  it("never consults the actual clock or mutates a frozen schedule", () => {
    const hours = Object.freeze([Object.freeze({ weekday: 7, from: "00:00", to: "24:00" })]);
    const clock = vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Actual clock read");
    });
    try {
      expect(value(datedSchedule([...hours], "2026-03-29", london))).toHaveLength(1);
      expect(instant("2026-03-29T02:00:00+01:00")).toBe(29579100);
      expect(value(addLocalDays("2026-03-29", 1))).toBe("2026-03-30");
      expect(value(gridStarts("2026-10-25", london, 60))).toHaveLength(25);
    } finally {
      clock.mockRestore();
    }
    expect(hours).toEqual([{ weekday: 7, from: "00:00", to: "24:00" }]);
  });

  it("returns structured failures without consulting the clock on invalid inputs", () => {
    const clock = vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Actual clock read");
    });
    try {
      const invalidResults = [
        formatOffsetInstant(Number.MAX_SAFE_INTEGER, london),
        formatOffsetInstant(-Number.MAX_SAFE_INTEGER, london),
        formatOffsetInstant(144000000001, london),
        formatOffsetInstant(-144000000001, london),
        formatOffsetInstant(0, "bad"),
        resolveRecurringBoundary("2026-01-01", "00:00", "bad"),
        datedSchedule([], "2026-01-01", "bad"),
        gridStarts("2026-01-01", "bad", 15),
        addLocalDays("2026-01-01", Number.MAX_SAFE_INTEGER),
        addLocalDays("2026-01-01", -Number.MAX_SAFE_INTEGER),
        addLocalDays("9999-12-31", 1),
        resolveRecurringBoundary("9999-12-31", "24:00", london, true),
        resolveRecurringBoundary("2026-03-29", "01:30", london),
        resolveRecurringBoundary("2026-10-25", "01:30", london),
      ];
      for (const result of invalidResults) {
        expect(result).toEqual({
          ok: false,
          issues: [expect.objectContaining({ message: expect.any(String) })],
        });
      }
    } finally {
      clock.mockRestore();
    }
  });
});
