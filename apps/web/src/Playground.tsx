import { useRef, type ReactNode, type RefObject } from "react";
import type { SlotCheck } from "./adapter/renderSlot.js";
import type { PolicyControls } from "./adapter/policyPreview.js";
import type { AppointmentStarts, SelectionView } from "./adapter/requestSelection.js";
import { CalendarJourney, type CalendarCheck } from "./CalendarJourney.js";
import { ExplanationJourney } from "./ExplanationJourney.js";
import { PolicyPlayground } from "./PolicyPlayground.js";
import "./styles.css";

export type SelectionChanges = Partial<Pick<SelectionView, "audience" | "date" | "serviceId">> & {
  practitionerId?: string;
};

type Props = {
  selection: SelectionView | null;
  starts: AppointmentStarts | "failed" | null;
  checked: SlotCheck | "failed" | null;
  calendar: CalendarCheck | "failed" | null;
  policy?: PolicyControls | null | undefined;
  policyStatus?: ReactNode;
  scenarios: readonly { id: string; label: string }[];
  clinicName?: string | undefined;
  persistent?: boolean | undefined;
  confirmed?: boolean | undefined;
  noPreference: string;
  scenarioPicker: RefObject<HTMLSelectElement | null>;
  requestTitle: RefObject<HTMLHeadingElement | null>;
  selectScenario: (id: string) => void;
  resetSelections: () => void;
  edit: (changes: SelectionChanges, start?: number | null, days?: number) => void;
  fallback: ReactNode;
  intro?: ReactNode;
  history?: ReactNode;
  extra?: ReactNode;
  booking?: ReactNode;
};

/** Share the Riverside request, calendar and explanation layout across adapters. */
export function Playground({
  selection,
  starts,
  checked,
  calendar,
  policy,
  policyStatus,
  scenarios,
  clinicName = "Riverside Family Clinic",
  persistent,
  confirmed,
  noPreference,
  scenarioPicker,
  requestTitle,
  selectScenario,
  resetSelections,
  edit,
  fallback,
  intro,
  history,
  extra,
  booking,
}: Props) {
  const playground = useRef<HTMLElement>(null);
  const verdict = confirmed
    ? "This appointment is confirmed"
    : selection?.start === null
      ? "No start fits in snapshot coverage on this date"
      : checked === null
        ? "Checking this appointment…"
        : checked === "failed" || checked.status === "invalid_request"
          ? "Could not check this appointment"
          : checked.status === "bookable"
            ? "This time is available"
            : checked.narration.headline;

  return (
    <>
      <a
        className="skip-link"
        href="#playground"
        onClick={(event) => {
          event.preventDefault();
          playground.current?.focus();
        }}
      >
        Skip to playground
      </a>
      <header className="site-header">
        <div className="frame brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">WhyNot</span>
          <span className="brand-clinic">{clinicName}</span>
        </div>
      </header>
      <main id="playground" ref={playground} className="frame" tabIndex={-1}>
        <div className="intro">
          <h1>Appointment playground</h1>
          {intro}
          <p>Explore how the clinic checks a requested appointment in patient and staff views.</p>
        </div>

        {history}

        {selection ? (
          <div className="workspace">
            <div className="workspace-column">
              <section className="card setup" aria-labelledby="setup-title">
                <h2 id="setup-title">Set up a request</h2>
                {selection.scenarioId !== undefined && (
                  <>
                    <label htmlFor="scenario">Scenario</label>
                    <select
                      id="scenario"
                      ref={scenarioPicker}
                      value={selection.scenarioId}
                      onChange={(event) => selectScenario(event.target.value)}
                    >
                      {scenarios.map(({ id, label }) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <fieldset>
                  <legend>View as</legend>
                  <div className="audience">
                    {(["patient", "staff"] as const).map((audience) => (
                      <label key={audience}>
                        <input
                          type="radio"
                          name="audience"
                          value={audience}
                          checked={selection.audience === audience}
                          onChange={() => edit({ audience }, selection.start)}
                        />
                        {audience === "patient" ? "Patient" : "Staff"}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor="service">Service</label>
                <select
                  id="service"
                  value={selection.serviceId}
                  onChange={(event) => edit({ serviceId: event.target.value }, selection.start)}
                >
                  {selection.services.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
                <label htmlFor="practitioner">Practitioner preference</label>
                <select
                  id="practitioner"
                  value={selection.practitionerId ?? noPreference}
                  onChange={(event) =>
                    edit({ practitionerId: event.target.value }, selection.start)
                  }
                >
                  <option value={noPreference}>Any practitioner</option>
                  {selection.practitioners.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
                <label htmlFor="date">Appointment date</label>
                <select
                  id="date"
                  value={selection.date}
                  onChange={(event) => edit({ date: event.target.value })}
                >
                  {selection.dates.map((date) => (
                    <option key={date}>{date}</option>
                  ))}
                </select>
                <label htmlFor="calendar-period">Calendar period</label>
                <select
                  id="calendar-period"
                  value={selection.days}
                  onChange={(event) => edit({}, selection.start, Number(event.target.value))}
                >
                  {selection.periods.map(({ days, label }) => (
                    <option key={days} value={days}>
                      {label}
                    </option>
                  ))}
                </select>
                {selection.scenarioId !== undefined && (
                  <button className="secondary reset" type="button" onClick={resetSelections}>
                    Reset selections
                  </button>
                )}
              </section>
              <CalendarJourney
                result={calendar}
                date={selection.date}
                endDate={selection.endDate}
                onNext={({ date, practitionerId, start }) => {
                  requestTitle.current?.focus();
                  edit({ date, practitionerId: practitionerId ?? noPreference }, start, 1);
                }}
              />
              <section className="card starts" aria-labelledby="starts-title">
                <h2 id="starts-title">Appointment starts</h2>
                {starts === null ? (
                  <p className="supporting" aria-live="polite">
                    Checking appointment starts…
                  </p>
                ) : starts === "failed" ? (
                  <p className="supporting" role="alert">
                    The clinic could not check appointment starts.
                  </p>
                ) : starts.length === 0 ? (
                  <p className="supporting">There are no scheduled starts on this date.</p>
                ) : (
                  <details key={selection.scenarioId}>
                    <summary>Choose a start</summary>
                    <ul className="start-grid">
                      {starts.map(({ start, time, available }) => (
                        <li key={start}>
                          <button
                            className="secondary start"
                            type="button"
                            aria-pressed={selection.start === start}
                            onClick={() => edit({}, start)}
                          >
                            <strong>{time}</strong>
                            <span>{available ? "Available" : "Unavailable"}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            </div>

            <div className="workspace-column">
              <section className="card requested" aria-labelledby="request-title">
                <h2 id="request-title" ref={requestTitle} tabIndex={-1}>
                  Requested appointment
                </h2>
                <div className="request-info">
                  <p className="service">{selection.service}</p>
                  <dl className="details">
                    <div>
                      <dt>Requested start</dt>
                      <dd>
                        {selection.instant === null ? (
                          selection.date
                        ) : (
                          <time dateTime={selection.instant}>
                            {selection.date} at {selection.time}
                          </time>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Practitioner</dt>
                      <dd>{selection.practitioner}</dd>
                    </div>
                  </dl>
                  <p className="verdict" role="status">
                    {verdict}
                  </p>
                </div>
                <div className="clock">
                  <strong>Frozen demo clock</strong>
                  <span>
                    <time dateTime={selection.clock}>
                      {selection.clock.slice(0, 10)} at {selection.clock.slice(11, 16)}
                    </time>
                    {" · "}
                    {selection.timezone}
                  </span>
                </div>
              </section>
              {!checked || confirmed ? null : checked === "failed" ||
                checked.status === "invalid_request" ? (
                <section className="card outcome invalid" aria-labelledby="check-error">
                  <h2 id="check-error">Appointment check failed</h2>
                  <p>Choose another start or reset the playground to try again.</p>
                </section>
              ) : (
                <ExplanationJourney
                  result={checked}
                  persistent={persistent}
                  onAlternative={({ date, practitionerId, start }) => {
                    requestTitle.current?.focus();
                    edit({ date, practitionerId: practitionerId ?? noPreference }, start);
                  }}
                />
              )}
              {booking}
              {selection.time !== undefined &&
                !confirmed &&
                policy &&
                checked &&
                checked !== "failed" &&
                checked.status !== "invalid_request" && (
                  <PolicyPlayground
                    key={JSON.stringify([
                      selection.scenarioId,
                      selection.date,
                      selection.start,
                      selection.serviceId,
                      selection.practitionerId,
                    ])}
                    policy={policy}
                    request={{ ...selection, time: selection.time }}
                    suggested={checked.status === "blocked" ? checked.suggestedChanges : undefined}
                  />
                )}
              {policyStatus}
            </div>
          </div>
        ) : (
          fallback
        )}
        {extra}
        <footer className="disclosure">
          Riverside Family Clinic is fictional. This playground uses synthetic data only.
        </footer>
      </main>
    </>
  );
}
