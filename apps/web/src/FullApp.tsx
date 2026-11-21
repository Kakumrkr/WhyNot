import { QueryClient, QueryClientProvider, skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BookingPanel } from "./BookingPanel.js";
import { Playground, type SelectionChanges } from "./Playground.js";
import { fullSelection } from "./adapter/fullSelection.js";
import { httpAdapter } from "./adapter/httpAdapter.js";
import { anyPractitioner, baseScenario, parseSelection } from "./adapter/requestSelection.js";
import { scenarios } from "./adapter/scenarios.js";
import { useBookingActions } from "./useBookingActions.js";
import { useFullQueries } from "./useFullQueries.js";

const choices = [baseScenario, ...scenarios];

function readLink() {
  const history = window.history.state as { start?: unknown; days?: unknown } | null;
  return {
    link: parseSelection(window.location.search, true),
    start: history?.start,
    days: history?.days,
  };
}

function FullPlayground() {
  const [navigation, setNavigation] = useState(readLink);
  const scenarioPicker = useRef<HTMLSelectElement>(null);
  const requestTitle = useRef<HTMLHeadingElement>(null);
  const focusAfterReset = useRef(false);
  const { link } = navigation;
  const scope = link?.scenario.id ?? baseScenario.id;
  const api = httpAdapter(scope);
  const clinic = useQuery({
    queryKey: [scope, "clinic"],
    queryFn: link ? ({ signal }) => api.clinic(signal) : skipToken,
    staleTime: Infinity,
    select: (config) => ({
      name: config.clinic.name,
      selection: link ? fullSelection(config, link, navigation.start, navigation.days) : null,
    }),
  });
  const selection = clinic.isError ? null : (clinic.data?.selection ?? null);
  const { starts, checked, checking, calendar, policy, policyFailed } = useFullQueries(
    api,
    selection,
  );
  const actions = useBookingActions(selection);
  const view = selection?.view;
  const selectedTime = Array.isArray(starts)
    ? starts.find(({ start }) => start === view?.start)?.time
    : undefined;

  useEffect(() => {
    const restore = () => setNavigation(readLink());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (view && focusAfterReset.current) {
      scenarioPicker.current?.focus();
      focusAfterReset.current = false;
    }
  }, [view]);

  function navigate(params: URLSearchParams, start?: number | null, days?: number, reset = false) {
    const url = new URL(window.location.href);
    url.search = params.toString();
    if (reset) {
      focusAfterReset.current = true;
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState({ start, days }, "", url);
    }
    setNavigation(readLink());
  }

  function edit(changes: SelectionChanges, start?: number | null, days = view?.days) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) params.set(key, value);
    navigate(params, start, days);
  }

  const resetSelections = () => navigate(new URLSearchParams(), undefined, undefined, true);
  let fallback;
  if (link && clinic.isPending) {
    fallback = (
      <p className="card" role="status">
        Connecting to the local clinic…
      </p>
    );
  } else if (clinic.isError) {
    fallback = (
      <section className="card invalid" aria-labelledby="connection-title">
        <h2 id="connection-title">Could not open the local clinic</h2>
        <p>Check that the local API and database are running.</p>
        <button type="button" onClick={() => void clinic.refetch()}>
          Retry connection
        </button>
      </section>
    );
  } else {
    fallback = (
      <section className="card invalid" aria-labelledby="invalid-title">
        <h2 id="invalid-title">This playground link is invalid</h2>
        <p>Reset the link to open the Riverside clinic in patient view.</p>
        <button type="button" onClick={resetSelections}>
          Reset selections
        </button>
      </section>
    );
  }

  return (
    <Playground
      intro={<p className="supporting">Local mode · Demo bookings are saved to PostgreSQL.</p>}
      persistent
      confirmed={actions.confirmed}
      clinicName={clinic.data?.name}
      selection={view ? { ...view, time: selectedTime ?? view.time } : null}
      starts={starts}
      checked={checked}
      calendar={calendar}
      policy={policy}
      policyStatus={
        view?.audience === "staff" &&
        !policy && (
          <p className="card supporting" aria-live="polite">
            {policyFailed ? "Could not load the clinic policy." : "Loading clinic policy…"}
          </p>
        )
      }
      scenarios={choices}
      noPreference={anyPractitioner}
      scenarioPicker={scenarioPicker}
      requestTitle={requestTitle}
      selectScenario={(scenarioId) =>
        navigate(new URLSearchParams({ scenarioId, audience: view?.audience ?? "patient" }))
      }
      resetSelections={resetSelections}
      edit={edit}
      fallback={fallback}
      booking={
        selection && (
          <BookingPanel
            key={JSON.stringify([scope, view?.audience, selection.slot])}
            api={api}
            selection={selection}
            actions={actions}
            canBook={
              !actions.confirmed &&
              !checking &&
              checked !== "failed" &&
              checked?.status === "bookable"
            }
          />
        )
      }
    />
  );
}

/** Start the full local playground with session-local server state. */
export function App() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <FullPlayground />
    </QueryClientProvider>
  );
}
