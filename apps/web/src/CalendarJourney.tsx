import type { renderRange } from "./adapter/calendarRange.js";

export type CalendarCheck = ReturnType<typeof renderRange>;
type NextOpening = NonNullable<CalendarCheck["next"]>;
type Sentences = CalendarCheck["narration"]["context"];

function Evidence({ sentences }: { sentences: Sentences }) {
  return (
    <ul>
      {sentences.map(({ text, factIds }) => (
        <li key={factIds.join(" ")}>{text}</li>
      ))}
    </ul>
  );
}

/** Describe the checked local calendar and offer only engine-verified next starts. */
export function CalendarJourney({
  result,
  date,
  endDate,
  onNext,
}: {
  result: CalendarCheck | "failed" | null;
  date: string;
  endDate: string;
  onNext: (opening: NextOpening) => void;
}) {
  const narration = result && result !== "failed" ? result.narration : null;
  const next = result && result !== "failed" ? result.next : null;
  return (
    <section className="card calendar-journey" aria-labelledby="calendar-title">
      <h2 id="calendar-title">Calendar availability</h2>
      <p className="supporting">
        <time dateTime={date}>{date}</time>
        {date !== endDate && (
          <>
            {" "}
            through <time dateTime={endDate}>{endDate}</time>
          </>
        )}
      </p>
      <p className="calendar-headline" aria-live="polite">
        {narration?.headline ??
          (result === "failed"
            ? "The clinic could not check these dates."
            : "Checking selected dates…")}
      </p>
      {narration?.status === "fully_blocked" && (
        <>
          {narration.commonCause.length > 1 && (
            <details>
              <summary>Common causes</summary>
              <Evidence sentences={narration.commonCause} />
            </details>
          )}
          {narration.context.length > 0 && (
            <details>
              <summary>Service requirements</summary>
              <Evidence sentences={narration.context} />
            </details>
          )}
          {narration.segments.length > 0 && (
            <div className="calendar-segments">
              <h3>Why these start times are unavailable</h3>
              {narration.segments.map(({ label, sentences }) => (
                <details key={label}>
                  <summary>{label}</summary>
                  <Evidence sentences={sentences} />
                </details>
              ))}
            </div>
          )}
          {narration.guidance.length > 0 && (
            <div className="guidance">
              <h3>Eligibility next step</h3>
              <Evidence sentences={narration.guidance} />
            </div>
          )}
          {next && (
            <div className="calendar-opening">
              <h3>Next verified opening</h3>
              <p>{next.label}</p>
              <button type="button" onClick={() => onNext(next)}>
                {next.changesPractitioner
                  ? "Change practitioner and check opening"
                  : "Check next opening"}
              </button>
            </div>
          )}
          {narration.searchNote && <p className="search-note">{narration.searchNote}</p>}
        </>
      )}
    </section>
  );
}
