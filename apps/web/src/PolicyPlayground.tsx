import { useState } from "react";
import type { PolicyChange, PolicyPatch } from "@whynot/contracts";
import type { Selection } from "./adapter/staticAdapter.js";

type Policy = NonNullable<Selection["policy"]>;
type Preview = Extract<ReturnType<Policy["preview"]>, { ok: true }>["value"];

function Outcome({ title, result }: { title: string; result: Preview["baseline"] }) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{result.headline}</p>
      {result.reasons.length > 0 && (
        <ul>
          {result.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      )}
      {result.assignment && (
        <p className="supporting">
          Assignment ·{" "}
          {[result.assignment.practitioner, result.assignment.room, result.assignment.equipment]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

/** Compare current clinic policy with a temporary patch for the selected staff request. */
export function PolicyPlayground({
  policy,
  suggested,
  request,
}: {
  policy: Policy;
  suggested?: PolicyPatch | undefined;
  request: Pick<Selection, "service" | "date" | "instant" | "practitioner">;
}) {
  const [setting, setSetting] = useState("");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ReturnType<Policy["preview"]> | "failed" | null>(null);
  const selected = setting === "" ? undefined : policy.settings[Number(setting)]?.change;
  const useSuggestion = setting === "suggested";
  const needsValue = selected !== undefined && selected.field !== "eligibility";

  function manualChange(change: Policy["settings"][number]["change"]): PolicyChange {
    if (change.field === "eligibility") return change;
    return { ...change, value: /^\d+$/.test(value.trim()) ? Number(value) : Number.NaN };
  }

  return (
    <section className="card policy-playground" aria-labelledby="policy-title">
      <h2 id="policy-title">Policy playground</h2>
      <p className="supporting">Preview hypothetical clinic settings for the original request.</p>
      <details>
        <summary>Explore policy changes</summary>
        <p className="supporting">
          Buffer and eligibility changes are hypothetical. Previewing leaves the clinic settings
          intact.
        </p>
        <p>
          {suggested
            ? "A verified policy fix is available."
            : "There is no verified policy fix for this request."}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              setResult(
                policy.preview(
                  useSuggestion ? suggested : selected ? [manualChange(selected)] : [],
                ),
              );
            } catch {
              setResult("failed");
            }
          }}
        >
          <label htmlFor="policy-setting">Setting to preview</label>
          <select
            id="policy-setting"
            value={setting}
            onChange={(event) => {
              setSetting(event.target.value);
              const change = policy.settings[Number(event.target.value)]?.change;
              setValue(typeof change?.value === "number" ? String(change.value) : "");
              setResult(null);
            }}
          >
            <option value="">Choose a setting</option>
            {suggested && <option value="suggested">Verified policy fix</option>}
            {policy.settings.map(({ label }, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
          {needsValue && (
            <>
              <label htmlFor="policy-value">New value</label>
              <input
                id="policy-value"
                inputMode="numeric"
                value={value}
                aria-invalid={result !== null && result !== "failed" && !result.ok}
                onChange={(event) => {
                  setValue(event.target.value);
                  setResult(null);
                }}
              />
            </>
          )}
          {selected?.field === "eligibility" && <p>Preview eligibility for any patient.</p>}
          <div className="policy-actions">
            <button type="submit">Preview change</button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setSetting("");
                setValue("");
                setResult(null);
              }}
            >
              Reset preview
            </button>
          </div>
        </form>
        <p role="status">
          {result === "failed"
            ? "Could not check the policy preview."
            : result?.ok
              ? "Policy preview ready."
              : result?.issues.map(({ message }) => message).join(" ")}
        </p>
        {result !== "failed" && result?.ok && (
          <div className="policy-comparison">
            <p>
              <strong>Original request</strong> · {request.service} · {request.date} at{" "}
              {request.instant.slice(11, 16)} · {request.practitioner}
            </p>
            <dl className="changes">
              {result.value.settings.map(({ label, from, to }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    {from} → {to}
                  </dd>
                </div>
              ))}
            </dl>
            <Outcome title="Current settings" result={result.value.baseline} />
            <Outcome title="Hypothetical settings" result={result.value.modified} />
          </div>
        )}
      </details>
    </section>
  );
}
