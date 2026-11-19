import type { StaffInspection } from "./adapter/staffInspector.js";

/** Show the staff trace with its original fact references and display limits. */
export function StaffInspector({ inspection }: { inspection: StaffInspection }) {
  const { basis, columns, resources, optimal, reducedRows, searchNodes } = inspection;
  const optimization =
    optimal === null
      ? "A candidate is bookable"
      : basis === "missing_resource"
        ? "A required resource is missing"
        : optimal
          ? "Lowest-weight explanation proven"
          : "Sufficient and irredundant fallback. Lowest weight unproven.";

  return (
    <section className="card inspector" aria-labelledby="inspector-title">
      <h2 id="inspector-title">Staff inspector</h2>
      <dl className="inspector-stats">
        <div>
          <dt>Explanation status</dt>
          <dd>{optimization}</dd>
        </div>
        <div>
          <dt>Reduced matrix rows</dt>
          <dd>{reducedRows.length}</dd>
        </div>
        <div>
          <dt>Explanation search nodes</dt>
          <dd>{searchNodes}</dd>
        </div>
        <div>
          <dt>Candidate trace</dt>
          <dd>
            {inspection.candidateCount} recorded
            {inspection.candidatesTruncated && " · truncated"}
          </dd>
        </div>
        <div>
          <dt>Alternative attempt trace</dt>
          <dd>
            {inspection.alternativeCount} recorded
            {inspection.alternativesTruncated && " · truncated"}
          </dd>
        </div>
      </dl>
      {columns.length > 0 && (
        <details>
          <summary>Fact key ({columns.length})</summary>
          <dl className="inspector-facts">
            {columns.map(({ id, code, text, details, primary }) => (
              <div key={id}>
                <dt className={primary ? "primary-fact" : undefined}>
                  {code} · {primary ? "Primary" : "Other violation"}
                </dt>
                <dd>
                  {text}
                  {details.length > 0 && (
                    <dl className="trace-parameters">
                      {details.map(({ label, value }) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {reducedRows.length > 0 && (
        <details>
          <summary>Reduced matrix ({reducedRows.length} rows)</summary>
          <ul>
            {reducedRows.map((codes) => (
              <li key={codes.join(" ")}>{codes.join(", ")}</li>
            ))}
          </ul>
        </details>
      )}
      {resources.length > 0 ? (
        <>
          <h3>Candidate matrix</h3>
          <p className="supporting">
            Open a practitioner to see room and equipment combinations. Primary columns show which
            facts cover each blocked candidate. Scroll across to see more facts. A dash means the
            fact does not apply to that row.
          </p>
          {resources.map(({ id, label, rows }) => (
            <details key={id}>
              <summary>
                {label} ({rows.length})
              </summary>
              <div
                className="matrix-scroll"
                role="region"
                aria-label={`${label} matrix scroll area`}
                tabIndex={0}
              >
                <table>
                  <caption>{label} candidate matrix</caption>
                  <thead>
                    <tr>
                      <th scope="col">Room and equipment</th>
                      {columns.map(({ id, code, ruleId, primary, text }) => (
                        <th
                          scope="col"
                          className={primary ? "primary-fact" : undefined}
                          key={id}
                          aria-label={`${code} · ${primary ? "Primary" : "Other violation"} · ${text}`}
                        >
                          {code} · {primary ? "Primary" : "Other"}
                          <span>{ruleId}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ key, room, equipment, violations }) => (
                      <tr key={key}>
                        <th scope="row">
                          {room}
                          {equipment && <span>{equipment}</span>}
                        </th>
                        {columns.map(({ id, primary }) => (
                          <td key={id} className={primary ? "primary-fact" : undefined}>
                            {violations.has(id) ? "Blocks" : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </>
      ) : (
        <p className="supporting">There are no candidate combinations.</p>
      )}
    </section>
  );
}
