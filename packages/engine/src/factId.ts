import { FactSchema, type Fact, type RuleId } from "@whynot/contracts";
import { catalog } from "./catalog.js";

function compareCodepoints(a: string, b: string): number {
  const left = Array.from(a, (char) => char.codePointAt(0)!);
  const right = Array.from(b, (char) => char.codePointAt(0)!);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i]! - right[i]!;
  }
  return left.length - right.length;
}

/** Collision-free grounding: JSON escapes delimiters; keys use codepoint ordering. */
export function factId(ruleId: RuleId, keys: Readonly<Record<string, string | number>>): string {
  return `${ruleId}:${JSON.stringify(
    Object.keys(keys)
      .sort(compareCodepoints)
      .map((key) => [key, keys[key]]),
  )}`;
}

/** Construct internal evidence with catalog-controlled metadata and validated parameters. */
export function makeFact<T extends RuleId>(
  ruleId: T,
  subject: Fact["subject"],
  params: Extract<Fact, { ruleId: T }>["params"],
  window?: Fact["window"],
): Fact {
  const entry = catalog[ruleId];
  return FactSchema.parse({
    id: factId(ruleId, {
      ...Object.fromEntries(Object.entries(params).map(([key, value]) => [`param.${key}`, value])),
      "subject.type": subject.type,
      "subject.id": subject.id,
      ...(window === undefined ? {} : { "window.from": window.from, "window.to": window.to }),
    }),
    ruleId,
    ruleVersion: entry.version,
    kind: entry.family,
    subject,
    params,
    ...(window === undefined ? {} : { window }),
    visibility: entry.visibility,
    relaxableBy: entry.relaxableBy,
  });
}
