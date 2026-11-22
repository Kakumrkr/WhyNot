import type { InsightsResponse, SimulationResponse } from "@whynot/contracts/api";
import { lazy, Suspense, type ComponentType } from "react";
import type { HistoryRuleChartProps } from "./HistoryRuleChart.js";

type SourceInsights = InsightsResponse["sources"][number];

const HistoryRuleChart = lazy<ComponentType<HistoryRuleChartProps>>(() =>
  import("./HistoryRuleChart.js").then(
    ({ HistoryRuleChart }) => ({ default: HistoryRuleChart }),
    () => ({ default: () => null }),
  ),
);
const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

/** Present the API counts and their recorded denominators. */
export function HistoryResults({ data }: { data: SourceInsights }) {
  const { slots, rangeEvaluations, reportedPrimaryRules, verifiedFixFeasibility } = data;
  const rules = reportedPrimaryRules.counts.map(({ ruleId, count }) => ({
    ruleId,
    label: ruleId.replaceAll("-", " "),
    count,
  }));
  return (
    <>
      <dl className="history-metrics">
        <div>
          <dt>Slot evaluations</dt>
          <dd>{slots.total}</dd>
          <dd className="supporting">
            {slots.bookable} bookable · {slots.blocked} blocked
          </dd>
        </div>
        <div>
          <dt>Blocked share</dt>
          <dd>
            {slots.blockedShare.fraction === null
              ? "—"
              : percent.format(slots.blockedShare.fraction)}
          </dd>
          <dd className="supporting">
            {slots.blocked} of {slots.blockedShare.denominator} decided slots
          </dd>
        </div>
        <div>
          <dt>Verified fixes</dt>
          <dd>{verifiedFixFeasibility.feasible}</dd>
          <dd className="supporting">
            Of {verifiedFixFeasibility.denominator} blocked slots assessed
          </dd>
        </div>
        <div>
          <dt>Range evaluations</dt>
          <dd>{rangeEvaluations}</dd>
        </div>
      </dl>
      {(slots.invalid > 0 || slots.unreadable > 0) && (
        <p className="supporting">
          {slots.invalid} invalid slots · {slots.unreadable} unreadable slots
        </p>
      )}
      <h4>Reported primary rules</h4>
      <p className="supporting">
        Counts use the selected explanation for each of {reportedPrimaryRules.denominator} blocked
        slots. A slot can contribute to more than one rule.
      </p>
      {rules.length > 0 ? (
        <div className="history-comparison">
          <Suspense fallback={null}>
            <HistoryRuleChart rows={rules} />
          </Suspense>
          <table className="history-table">
            <caption>Reported primary rule counts</caption>
            <thead>
              <tr>
                <th scope="col">Rule</th>
                <th scope="col">Slots</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(({ ruleId, label, count }) => (
                <tr key={ruleId}>
                  <th scope="row">{label}</th>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No primary rules were reported.</p>
      )}
    </>
  );
}

const outcomeLabels = { bookable: "Bookable", blocked: "Blocked" };

export function ReplayResults({ result }: { result: SimulationResponse }) {
  const counts = [
    ["Eligible slots", result.eligible],
    ["Newly feasible", result.newlyFeasible],
    ["Still blocked", result.stillBlocked],
    ["Still feasible", result.stillFeasible],
    ["No longer feasible", result.noLongerFeasible],
    ["Unsupported engine version", result.unsupported],
    ["Incomplete evidence", result.incomplete],
    ["Recorded invalid requests", result.invalid],
    ["Patch inapplicable", result.inapplicable],
  ] as const;
  return (
    <div className="history-comparison">
      <table className="history-table">
        <caption>Historical replay counts</caption>
        <thead>
          <tr>
            <th scope="col">Outcome</th>
            <th scope="col">Slots</th>
          </tr>
        </thead>
        <tbody>
          {counts.map(([label, count]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.examples.length > 0 && (
        <table className="history-table history-examples">
          <caption>Before and after examples</caption>
          <thead>
            <tr>
              <th scope="col">Start in UTC</th>
              <th scope="col">Recorded policy</th>
              <th scope="col">Proposed policy</th>
            </tr>
          </thead>
          <tbody>
            {result.examples.map(({ start, before, after }) => (
              <tr key={`${before}/${after}`}>
                <th scope="row">
                  <time dateTime={start}>
                    {start.slice(0, 10)} {start.slice(11, 16)}
                  </time>
                </th>
                <td>{outcomeLabels[before]}</td>
                <td>{outcomeLabels[after]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
