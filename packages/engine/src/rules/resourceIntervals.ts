import type { Booking, Fact } from "@whynot/contracts";
import { makeFact } from "../factId.js";
import { intervalsOverlap } from "../time.js";
import type { RuleContext } from "../validateRequest.js";

type Interval = { from: number; to: number };

/** Sorted start index with prefix maxima: nested long intervals cannot be missed. */
export function intervalLookup<T extends Interval>(input: readonly T[]) {
  const entries = [...input].sort((a, b) => a.from - b.from || a.to - b.to);
  const maxima: number[] = [];
  for (const entry of entries) maxima.push(Math.max(maxima.at(-1) ?? -Infinity, entry.to));
  return (query: Interval): T[] => {
    let low = 0;
    let high = entries.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (entries[mid]!.from < query.to) low = mid + 1;
      else high = mid;
    }
    const matches: T[] = [];
    for (let i = low - 1; i >= 0 && maxima[i]! > query.from; i--) {
      if (intervalsOverlap(entries[i]!, query)) matches.push(entries[i]!);
    }
    return matches;
  };
}

/** Stable fact order is independent of booking, window and schedule input order. */
export function canonicalFacts(facts: Fact[]): Fact[] {
  const compare = (a: string, b: string): number => {
    const left = Array.from(a, (char) => char.codePointAt(0)!);
    const right = Array.from(b, (char) => char.codePointAt(0)!);
    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      if (left[i] !== right[i]) return left[i]! - right[i]!;
    }
    return left.length - right.length;
  };
  return [...new Map(facts.map((fact) => [fact.id, fact])).values()].sort((a, b) =>
    compare(a.id, b.id),
  );
}

/** Confirmed occupancy, including the existing and requested service's trailing policy. */
export function occupancyFacts(
  context: RuleContext,
  subject: Fact["subject"],
  bookings: Booking[],
  dimension: "practitioner" | "room" | "equipment",
): Fact[] {
  const { service, snapshot, interval } = context;
  const field = dimension === "room" ? "roomTurnoverMin" : "bufferAfterMin";
  const requestedBuffer = dimension === "equipment" ? 0 : service[field];
  const services = new Map(snapshot.services.map((entry) => [entry.id, entry]));
  const indexed = bookings
    .filter((booking) => booking.status === "confirmed")
    .map((booking) => {
      const existing = services.get(booking.serviceId);
      if (existing === undefined) throw new Error("Validated booking service missing");
      const buffer = dimension === "equipment" ? 0 : existing[field];
      return { from: booking.start, to: booking.end + buffer, booking, buffer };
    });
  const facts: Fact[] = [];
  for (const { booking, buffer } of intervalLookup(indexed)({
    from: interval.from,
    to: interval.to + requestedBuffer,
  })) {
    const window = { from: booking.start, to: booking.end };
    if (intervalsOverlap(window, interval)) {
      facts.push(makeFact(`${dimension}-busy`, subject, { bookingId: booking.id }, window));
      continue;
    }
    const afterExisting = booking.end <= interval.from;
    const bufferMin = afterExisting ? buffer : requestedBuffer;
    const serviceId = afterExisting ? booking.serviceId : service.id;
    const bufferWindow = afterExisting
      ? { from: booking.end, to: booking.end + bufferMin }
      : { from: interval.to, to: interval.to + bufferMin };
    if (dimension === "practitioner")
      facts.push(
        makeFact(
          "practitioner-buffer",
          subject,
          { bookingId: booking.id, serviceId, bufferMin },
          bufferWindow,
        ),
      );
    if (dimension === "room")
      facts.push(
        makeFact(
          "room-turnover",
          subject,
          { bookingId: booking.id, serviceId, turnoverMin: bufferMin },
          bufferWindow,
        ),
      );
  }
  return facts;
}
