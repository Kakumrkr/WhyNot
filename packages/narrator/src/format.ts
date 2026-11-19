import type { ClinicSnapshot } from "@whynot/contracts";

export type TemplateDisplay = {
  timeZone: ClinicSnapshot["clinic"]["timezone"];
  locale?: string;
  practitioners?: ReadonlyMap<string, string>;
  services?: ReadonlyMap<string, string>;
  rooms?: ReadonlyMap<string, string>;
  equipment?: ReadonlyMap<string, string>;
};

const millisecondsPerMinute = 60000;
const millisecondsPerDay = 24 * 60 * millisecondsPerMinute;
const dateLimitMilliseconds = 8.64e15;

/** Format elapsed durations without rounding exact policy values. */
export function duration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourText = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  const minuteText = `${remainder} ${remainder === 1 ? "minute" : "minutes"}`;
  if (hours === 0) return minuteText;
  return remainder === 0 ? hourText : `${hourText} ${minuteText}`;
}

/** Resolve display labels supplied by the caller and format instants in the clinic zone. */
export function createFormat({ timeZone, locale = "en-GB", ...labels }: TemplateDisplay) {
  const day = new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "medium" });
  const clock = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const zonedClock = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "shortOffset",
  });
  const instant = (minute: number) =>
    `${day.format(minute * millisecondsPerMinute)}, ${zonedClock.format(minute * millisecondsPerMinute)}`;
  const offset = (milliseconds: number) =>
    zonedClock.formatToParts(milliseconds).find(({ type }) => type === "timeZoneName")?.value;
  function until({ from, to }: { from: number; to: number }): string {
    const end = to * millisecondsPerMinute;
    if (day.format(from * millisecondsPerMinute) !== day.format(end)) return instant(to);
    // Nearby offset changes can repeat a clock time even when the whole window
    // is on one side of the transition. Keep the offset visible around the change.
    const endOffset = offset(end);
    const before = Math.max(-dateLimitMilliseconds, end - millisecondsPerDay);
    const after = Math.min(dateLimitMilliseconds, end + millisecondsPerDay);
    return endOffset === offset(before) && endOffset === offset(after)
      ? clock.format(end)
      : zonedClock.format(end);
  }
  return {
    instant,
    practitioner: (id?: string) =>
      (id === undefined ? undefined : labels.practitioners?.get(id)) ?? "This practitioner",
    staffPractitioner: (id: string) => labels.practitioners?.get(id) ?? id,
    staffService: (id: string) => labels.services?.get(id) ?? id,
    staffResource: (type: "room" | "equipment", id: string) =>
      (type === "room" ? labels.rooms : labels.equipment)?.get(id) ?? id,
    until,
  };
}

export type Format = ReturnType<typeof createFormat>;
