import type { ClinicSnapshot } from "@whynot/contracts";

export type TemplateDisplay = {
  timeZone: ClinicSnapshot["clinic"]["timezone"];
  locale?: string;
  practitioners?: ReadonlyMap<string, string>;
  rooms?: ReadonlyMap<string, string>;
  equipment?: ReadonlyMap<string, string>;
};

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
    `${day.format(minute * 60000)}, ${zonedClock.format(minute * 60000)}`;
  return {
    instant,
    practitioner: (id?: string) =>
      (id === undefined ? undefined : labels.practitioners?.get(id)) ?? "This practitioner",
    staffResource: (type: "room" | "equipment", id: string) =>
      (type === "room" ? labels.rooms : labels.equipment)?.get(id) ?? id,
    until: ({ from, to }: { from: number; to: number }) =>
      day.format(from * 60000) === day.format(to * 60000) ? clock.format(to * 60000) : instant(to),
  };
}

export type Format = ReturnType<typeof createFormat>;
