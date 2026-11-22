import { skipToken, useQuery } from "@tanstack/react-query";
import type { PolicyPatch } from "@whynot/contracts";
import type { SimulationBody } from "@whynot/contracts/api";
import { addLocalDays } from "@whynot/engine";
import type { TemplateDisplay } from "@whynot/narrator";
import { useRef, useState, type FormEvent } from "react";
import { HistoryResults, ReplayResults } from "./HistoryResults.js";
import type { HttpAdapter } from "./adapter/httpAdapter.js";
import { describePolicyChanges } from "./adapter/policyPreview.js";
import { timeValue } from "./adapter/requestSelection.js";
import "./history.css";

type Source = SimulationBody["source"];
type HistoryWindow = Pick<SimulationBody, "from" | "to">;
type Cursor = NonNullable<SimulationBody["cursor"]>;
type Page = { number: number; cursor: Cursor | null };
const firstPage: Page = { number: 1, cursor: null };
const sources = {
  synthetic_history: "Seeded synthetic history",
  live_demo: "Live demo captures",
} satisfies Record<Source, string>;

function windowFor(from: string, to: string): HistoryWindow {
  return { from: `${from}T00:00:00Z`, to: `${to}T00:00:00Z` };
}

function PageControls({
  page,
  next,
  select,
  subject,
}: {
  page: Page;
  next: Cursor | null;
  select: (page: Page) => void;
  subject: "history" | "replay";
}) {
  if (page.number === 1 && next === null) return null;
  return (
    <div className="history-pages">
      <span>Page {page.number} · Counts are for this page.</span>
      {page.number > 1 && (
        <button className="secondary" type="button" onClick={() => select(firstPage)}>
          First {subject} page
        </button>
      )}
      {next !== null && (
        <button
          className="secondary"
          type="button"
          onClick={() => select({ number: page.number + 1, cursor: next })}
        >
          Next {subject} page
        </button>
      )}
    </div>
  );
}

function HistorySimulation({
  api,
  scope,
  window,
  source,
  changes,
  display,
}: {
  api: HttpAdapter;
  scope: string;
  window: HistoryWindow;
  source: Source;
  changes: PolicyPatch | undefined;
  display: TemplateDisplay;
}) {
  const [page, setPage] = useState<Page | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const body = page &&
    changes && {
      ...window,
      source,
      changes,
      ...(page.cursor ? { cursor: page.cursor } : {}),
    };
  const query = useQuery({
    queryKey: [scope, "history-replay", body],
    queryFn: body ? ({ signal }) => api.simulate(body, signal) : skipToken,
  });
  const result = query.isError || query.isFetching ? undefined : query.data;

  function start() {
    title.current?.focus();
    if (page?.number === 1) void query.refetch();
    else setPage(firstPage);
  }

  function selectPage(next: Page) {
    setPage(next);
    title.current?.focus();
  }

  return (
    <section className="history-section" aria-labelledby="historical-estimate">
      <h3 id="historical-estimate" ref={title} tabIndex={-1}>
        Independent replay estimate
      </h3>
      <p className="supporting">
        Each slot is replayed independently using its recorded occupancy, clock and settings. This
        feasibility estimate omits occupancy from hypothetical bookings, demand, clinical
        suitability and actual conversion.
      </p>
      <p className="supporting">{sources[source]} · Uses the applied date filters.</p>
      {changes ? (
        <>
          <dl className="history-patch">
            {describePolicyChanges(changes, display).map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <button type="button" disabled={query.isFetching} onClick={start}>
            Replay verified policy fix
          </button>
        </>
      ) : (
        <p>Select a blocked appointment with a verified policy fix to run a replay.</p>
      )}
      <p role="status">
        {query.isFetching
          ? "Replaying stored slots…"
          : result?.total === 0
            ? "No stored slots to replay in this window."
            : result
              ? `Replayed ${result.total} stored slots on this page.`
              : ""}
      </p>
      {query.isError && (
        <div className="history-pages">
          <p role="alert">Could not replay the stored slots.</p>
          <button
            className="secondary"
            type="button"
            onClick={() => {
              title.current?.focus();
              void query.refetch();
            }}
          >
            Retry replay
          </button>
        </div>
      )}
      {result !== undefined && page !== null && result.total > 0 && (
        <>
          <ReplayResults result={result} />
          <PageControls page={page} next={result.nextCursor} select={selectPage} subject="replay" />
        </>
      )}
    </section>
  );
}

/** Filter fictional staff history and replay the selected appointment's verified fix. */
export function HistoryDashboard({
  api,
  scope,
  demoDate,
  changes,
  display,
}: {
  api: HttpAdapter;
  scope: string;
  demoDate: string;
  changes: PolicyPatch | undefined;
  display: TemplateDisplay;
}) {
  const [draft, setDraft] = useState<{ from: string; to: string; source: Source }>(() => ({
    from: timeValue(addLocalDays(demoDate, -14)),
    to: timeValue(addLocalDays(demoDate, 1)),
    source: "synthetic_history",
  }));
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(firstPage);
  const [invalidWindow, setInvalidWindow] = useState(false);
  const outcomesTitle = useRef<HTMLHeadingElement>(null);
  const window = windowFor(filters.from, filters.to);
  const query = useQuery({
    queryKey: [scope, "history-insights", window, page.cursor],
    queryFn: ({ signal }) => api.insights({ ...window, ...page.cursor }, signal),
  });
  const result = query.isError || query.isFetching ? undefined : query.data;
  const source = result?.sources[filters.source === "synthetic_history" ? 1 : 0];
  const hasHistory = source !== undefined && source.slots.total + source.rangeEvaluations > 0;

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.from >= draft.to) {
      setInvalidWindow(true);
      return;
    }
    setInvalidWindow(false);
    setPage(firstPage);
    setFilters(draft);
    if (page.number === 1 && draft.from === filters.from && draft.to === filters.to)
      void query.refetch();
  }

  function selectPage(next: Page) {
    setPage(next);
    outcomesTitle.current?.focus();
  }

  return (
    <section
      id="history-insights"
      className="card history-dashboard"
      aria-labelledby="history-title"
    >
      <h2 id="history-title">History insights</h2>
      <p className="supporting">
        {filters.source === "live_demo"
          ? "Live demo captures · Synthetic data"
          : sources[filters.source]}
      </p>
      <form className="history-filters" onSubmit={applyFilters}>
        <div>
          <label htmlFor="history-source">History source</label>
          <select
            id="history-source"
            value={draft.source}
            onChange={(event) => {
              const source = event.target.value === "live_demo" ? "live_demo" : "synthetic_history";
              setDraft({ ...draft, source });
            }}
          >
            <option value="synthetic_history">{sources.synthetic_history}</option>
            <option value="live_demo">{sources.live_demo}</option>
          </select>
        </div>
        <div>
          <label htmlFor="history-from">From date (UTC)</label>
          <input
            required
            type="date"
            id="history-from"
            value={draft.from}
            aria-invalid={invalidWindow}
            onChange={(event) => {
              setDraft({ ...draft, from: event.target.value });
              setInvalidWindow(false);
            }}
          />
        </div>
        <div>
          <label htmlFor="history-to">Before date (UTC)</label>
          <input
            required
            type="date"
            id="history-to"
            value={draft.to}
            aria-invalid={invalidWindow}
            onChange={(event) => {
              setDraft({ ...draft, to: event.target.value });
              setInvalidWindow(false);
            }}
          />
        </div>
        <button type="submit">Apply history filters</button>
      </form>
      {invalidWindow && <p role="alert">The before date must be later than the from date.</p>}
      <section className="history-section" aria-labelledby="history-outcomes">
        <h3 id="history-outcomes" ref={outcomesTitle} tabIndex={-1}>
          Recorded outcomes
        </h3>
        <p className="supporting">
          Recorded evaluation dates from <time dateTime={window.from}>{filters.from}</time> until{" "}
          <time dateTime={window.to}>{filters.to}</time> (exclusive, UTC). Counts use evaluation
          records and can include repeat requests from one patient.
        </p>
        <p role="status">
          {query.isFetching
            ? "Loading history…"
            : result &&
              (hasHistory
                ? `${sources[filters.source]} loaded.`
                : "No evaluations for this source on this page.")}
        </p>
        {query.isError && (
          <div className="history-pages">
            <p role="alert">Could not load history insights.</p>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                outcomesTitle.current?.focus();
                void query.refetch();
              }}
            >
              Retry history
            </button>
          </div>
        )}
        {hasHistory && <HistoryResults data={source} />}
        {result && (
          <PageControls
            page={page}
            next={result.nextCursor}
            select={selectPage}
            subject="history"
          />
        )}
      </section>
      <HistorySimulation
        key={JSON.stringify([filters, changes])}
        api={api}
        scope={scope}
        window={window}
        source={filters.source}
        changes={changes}
        display={display}
      />
    </section>
  );
}
