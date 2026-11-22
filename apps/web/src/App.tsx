import { useEffect, useRef, useState } from "react";
import type { SyntheticSnapshotEnvelope } from "@whynot/contracts";
import { staticAdapter } from "./adapter/staticAdapter.js";
import { anyPractitioner } from "./adapter/requestSelection.js";
import type { SlotCheck } from "./adapter/renderSlot.js";
import type { CalendarCheck } from "./CalendarJourney.js";
import { Playground, type SelectionChanges } from "./Playground.js";
import { SnapshotControls, type SnapshotControlsHandle } from "./SnapshotControls.js";

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
  const [imported, setImported] = useState<SyntheticSnapshotEnvelope>();
  const noPreference = imported ? "" : anyPractitioner;
  const [checked, setChecked] = useState<SlotCheck | "failed" | null>(null);
  const [calendar, setCalendar] = useState<CalendarCheck | "failed" | null>(null);
  const scenarioPicker = useRef<HTMLSelectElement>(null);
  const requestTitle = useRef<HTMLHeadingElement>(null);
  const focusAfterReset = useRef(false);
  const snapshotControls = useRef<SnapshotControlsHandle>(null);

  useEffect(() => {
    const resetRead = () => snapshotControls.current?.resetRead();
    const restore = () => {
      resetRead();
      setImported(undefined);
      setChecked(null);
      setCalendar(null);
      setScreen(openSelection());
    };
    const restoreCachedPage = (event: PageTransitionEvent) => {
      if (event.persisted) restore();
    };
    window.addEventListener("popstate", restore);
    window.addEventListener("pagehide", resetRead);
    window.addEventListener("pageshow", restoreCachedPage);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("pagehide", resetRead);
      window.removeEventListener("pageshow", restoreCachedPage);
    };
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
    snapshotControls.current?.resetRead();
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

  function openImported(envelope: SyntheticSnapshotEnvelope) {
    let next;
    try {
      next = staticAdapter.openImported(envelope);
    } catch {
      throw new Error("This snapshot could not be opened. Check its clinic schedule and coverage.");
    }
    setImported(envelope);
    setChecked(null);
    setCalendar(null);
    setScreen({ selection: next });
  }

  function resetImported() {
    setImported(undefined);
    setChecked(null);
    setCalendar(null);
    setScreen(openSelection());
  }

  function edit(changes: SelectionChanges, start?: number | null, days = selection?.days) {
    if (imported && selection) {
      setChecked(null);
      setCalendar(null);
      setScreen({
        selection: staticAdapter.openImported(imported, {
          audience: changes.audience ?? selection.audience,
          date: changes.date ?? selection.date,
          serviceId: changes.serviceId ?? selection.serviceId,
          practitionerId:
            changes.practitionerId === undefined
              ? selection.practitionerId
              : changes.practitionerId || undefined,
          ...(days === undefined ? {} : { days }),
          ...(start === undefined ? {} : { start }),
        }),
      });
      return;
    }
    const query = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) query.set(key, value);
    update(query, start ?? undefined, false, days);
  }

  const resetSelections = () => update(new URLSearchParams(), undefined, true);
  return (
    <Playground
      intro={
        <p className="supporting">
          Static mode · History insights are available in the full local app.
        </p>
      }
      selection={selection}
      starts={selection?.starts ?? null}
      checked={checked}
      calendar={calendar}
      policy={selection?.policy}
      scenarios={staticAdapter.scenarios}
      clinicName={imported?.snapshot.clinic.name}
      noPreference={noPreference}
      scenarioPicker={scenarioPicker}
      requestTitle={requestTitle}
      selectScenario={(scenarioId) =>
        update(new URLSearchParams({ scenarioId, audience: selection?.audience ?? "patient" }))
      }
      resetSelections={resetSelections}
      edit={edit}
      fallback={
        imported ? (
          <section className="card invalid" aria-labelledby="import-empty">
            <h2 id="import-empty">No appointment request to check</h2>
            <p>Add at least one synthetic patient and service to the file, then import it again.</p>
          </section>
        ) : (
          <section className="card invalid" aria-labelledby="invalid-title">
            <h2 id="invalid-title">
              {screen.failed ? "Could not open the playground" : "This playground link is invalid"}
            </h2>
            <p>Reset the link to open the default scenario and patient view.</p>
            <button type="button" onClick={resetSelections}>
              Reset selections
            </button>
          </section>
        )
      }
      extra={
        <SnapshotControls
          ref={snapshotControls}
          envelope={imported ?? selection?.envelope}
          imported={imported !== undefined}
          onImport={openImported}
          onReset={resetImported}
        />
      }
    />
  );
}
