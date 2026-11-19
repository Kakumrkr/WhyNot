import { useEffect, useRef, useState } from "react";
import { anyPractitioner, staticAdapter, type SlotCheck } from "./adapter/staticAdapter.js";
import { CalendarJourney, type CalendarCheck } from "./CalendarJourney.js";
import { ExplanationJourney } from "./ExplanationJourney.js";
import { PolicyPlayground } from "./PolicyPlayground.js";
import "./styles.css";

function openSelection() {
  const history = window.history.state as { start?: unknown; days?: unknown } | null;
  try {
    return { selection: staticAdapter.open(window.location.search, history?.start, history?.days) };
  } catch {
    return { selection: null, failed: true };
  }
}

/** Riverside's curated playground and shareable selection controls. */
export function App() {
  const [screen, setScreen] = useState(openSelection);
  const { selection } = screen;
  const [checked, setChecked] = useState<SlotCheck | "failed" | null>(null);
  const [calendar, setCalendar] = useState<CalendarCheck | "failed" | null>(null);
  const playground = useRef<HTMLElement>(null);
  const scenarioPicker = useRef<HTMLSelectElement>(null);
  const requestTitle = useRef<HTMLHeadingElement>(null);
  const focusAfterReset = useRef(false);

  useEffect(() => {
    const restore = () => {
      setChecked(null);
      setCalendar(null);
      setScreen(openSelection());
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (selection && focusAfterReset.current) {
      scenarioPicker.current?.focus();
      focusAfterReset.current = false;
    }
  }, [selection]);

  useEffect(() => {
    if (!selection) return;
    // Check after rendering the selection so the pending state can be announced.
    const timer = window.setTimeout(() => {
      try {
        setChecked(selection.check());
      } catch {
        setChecked("failed");
      }
      try {
        setCalendar(selection.range());
      } catch {
        setCalendar("failed");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selection]);

  function update(query: URLSearchParams, start?: number, reset = false, days?: number) {
    const url = new URL(window.location.href);
    url.search = query.toString();
    if (reset) {
      window.history.replaceState(null, "", url);
      focusAfterReset.current = true;
    } else {
      window.history.pushState({ start, days }, "", url);
    }
    setChecked(null);
    setCalendar(null);
    setScreen(openSelection());
  }

  function edit(changes: Record<string, string>, start?: number, days = selection?.days) {
    const query = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) query.set(key, value);
    update(query, start, false, days);
  }

  const verdict =
    checked === null
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
          <span className="brand-clinic">Riverside Family Clinic</span>
        </div>
      </header>
      <main id="playground" ref={playground} className="frame" tabIndex={-1}>
        <div className="intro">
          <h1>Appointment playground</h1>
          <p>Explore how Riverside checks a requested appointment in patient and staff views.</p>
        </div>

        {selection ? (
          <div className="workspace">
            <div className="workspace-column">
              <section className="card setup" aria-labelledby="setup-title">
                <h2 id="setup-title">Set up a request</h2>
                <label htmlFor="scenario">Scenario</label>
                <select
                  id="scenario"
                  ref={scenarioPicker}
                  value={selection.scenarioId}
                  onChange={(event) =>
                    update(
                      new URLSearchParams({
                        scenarioId: event.target.value,
                        audience: selection.audience,
                      }),
                    )
                  }
                >
                  {staticAdapter.scenarios.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
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
                  value={selection.practitionerId}
                  onChange={(event) =>
                    edit({ practitionerId: event.target.value }, selection.start)
                  }
                >
                  <option value={anyPractitioner}>Any practitioner</option>
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
                <button
                  className="secondary reset"
                  type="button"
                  onClick={() => update(new URLSearchParams(), undefined, true)}
                >
                  Reset selections
                </button>
              </section>
              <CalendarJourney
                result={calendar}
                date={selection.date}
                endDate={selection.endDate}
                onNext={({ date, practitionerId, start }) => {
                  requestTitle.current?.focus();
                  edit({ date, practitionerId: practitionerId ?? anyPractitioner }, start, 1);
                }}
              />
              <section className="card starts" aria-labelledby="starts-title">
                <h2 id="starts-title">Appointment starts</h2>
                {selection.starts.length === 0 ? (
                  <p className="supporting">There are no scheduled starts on this date.</p>
                ) : (
                  <details key={selection.scenarioId}>
                    <summary>Choose a start</summary>
                    <ul className="start-grid">
                      {selection.starts.map(({ start, time, available }) => (
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
                        <time dateTime={selection.instant}>
                          {selection.date} at {selection.instant.slice(11, 16)}
                        </time>
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
              {!checked ? null : checked === "failed" || checked.status === "invalid_request" ? (
                <section className="card outcome invalid" aria-labelledby="check-error">
                  <h2 id="check-error">Appointment check failed</h2>
                  <p>Choose another start or reset the playground to try again.</p>
                </section>
              ) : (
                <ExplanationJourney
                  result={checked}
                  onAlternative={({ date, practitionerId, start }) => {
                    requestTitle.current?.focus();
                    edit({ date, practitionerId: practitionerId ?? anyPractitioner }, start);
                  }}
                />
              )}
              {selection.policy &&
                checked &&
                checked !== "failed" &&
                checked.status !== "invalid_request" && (
                  <PolicyPlayground
                    policy={selection.policy}
                    request={selection}
                    suggested={checked.status === "blocked" ? checked.suggestedChanges : undefined}
                  />
                )}
            </div>
          </div>
        ) : (
          <section className="card invalid" aria-labelledby="invalid-title">
            <h2 id="invalid-title">
              {screen.failed ? "Could not open the playground" : "This playground link is invalid"}
            </h2>
            <p>Reset the link to open the default scenario and patient view.</p>
            <button type="button" onClick={() => update(new URLSearchParams(), undefined, true)}>
              Reset selections
            </button>
          </section>
        )}
        <footer className="disclosure">
          Riverside Family Clinic is fictional. This playground uses synthetic data only.
        </footer>
      </main>
    </>
  );
}
