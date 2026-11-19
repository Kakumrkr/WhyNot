import { useEffect, useRef, useState } from "react";
import { staticAdapter } from "./adapter/staticAdapter.js";
import "./styles.css";

/** Riverside's curated playground and shareable selection controls. */
export function App() {
  const [selection, setSelection] = useState(() => staticAdapter.open(window.location.search));
  const scenarioPicker = useRef<HTMLSelectElement>(null);
  const focusAfterReset = useRef(false);

  useEffect(() => {
    const restore = () => setSelection(staticAdapter.open(window.location.search));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (selection && focusAfterReset.current) {
      scenarioPicker.current?.focus();
      focusAfterReset.current = false;
    }
  }, [selection]);

  function update(query: URLSearchParams, reset = false) {
    const serialized = query.toString();
    const next = staticAdapter.open(serialized);
    const url = new URL(window.location.href);
    url.search = serialized;
    if (reset) {
      window.history.replaceState(null, "", url);
      focusAfterReset.current = true;
    } else {
      window.history.pushState(null, "", url);
    }
    setSelection(next);
  }

  return (
    <>
      <a className="skip-link" href="#playground">
        Skip to playground
      </a>
      <header className="site-header">
        <div className="frame brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">WhyNot</span>
          <span className="brand-clinic">Riverside Family Clinic</span>
        </div>
      </header>
      <main id="playground" className="frame" tabIndex={-1}>
        <div className="intro">
          <h1>Appointment playground</h1>
          <p>Explore how Riverside checks a requested appointment in patient and staff views.</p>
        </div>

        {selection ? (
          <div className="workspace">
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
                        onChange={() => {
                          const query = new URLSearchParams(window.location.search);
                          query.set("audience", audience);
                          update(query);
                        }}
                      />
                      {audience === "patient" ? "Patient" : "Staff"}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section className="card requested" aria-labelledby="request-title">
              <h2 id="request-title">Requested appointment</h2>
              <div className="request-info" aria-live="polite" aria-atomic="true">
                <p className="service">{selection.service}</p>
                <dl className="details">
                  <div>
                    <dt>Requested start</dt>
                    <dd>
                      <time dateTime={`${selection.date}T${selection.time}`}>
                        {selection.date} at {selection.time}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>Practitioner</dt>
                    <dd>{selection.practitioner}</dd>
                  </div>
                </dl>
                <p className="verdict">
                  {selection.status === "bookable"
                    ? "This time is available"
                    : "This time is unavailable"}
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
          </div>
        ) : (
          <section className="card invalid" aria-labelledby="invalid-title">
            <h2 id="invalid-title">This playground link is invalid</h2>
            <p>Reset the link to open the default scenario and patient view.</p>
            <button type="button" onClick={() => update(new URLSearchParams(), true)}>
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
