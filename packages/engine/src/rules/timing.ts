import type { Fact } from "@whynot/contracts";
import { makeFact } from "../factId.js";
import type { RuleContext } from "../validateRequest.js";

/** Notice and advance compare exact elapsed UTC minutes; equality is permitted. */
export function checkTiming({ snapshot, request, options }: RuleContext): Fact[] {
  const actualMin = request.start - options.now;
  const { minNoticeMin, maxAdvanceDays } = snapshot.policy;
  const subject = { type: "clinic", id: snapshot.clinic.id } as const;
  const facts: Fact[] = [];
  if (actualMin < minNoticeMin)
    facts.push(makeFact("min-notice", subject, { requiredMin: minNoticeMin, actualMin }));
  if (actualMin > maxAdvanceDays * 1440)
    facts.push(makeFact("max-advance", subject, { maxAdvanceDays, actualMin }));
  return facts;
}
