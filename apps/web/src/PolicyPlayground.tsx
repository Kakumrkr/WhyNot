import { useState } from "react";
import type { PolicyChange, PolicyPatch } from "@whynot/contracts";
import type { PolicyControls, PolicyResult } from "./adapter/policyPreview.js";
import type { SelectionView } from "./adapter/requestSelection.js";

type Preview = Extract<PolicyResult, { ok: true }>["value"];

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
  policy: PolicyControls;
  suggested?: PolicyPatch | undefined;
  request: Pick<SelectionView, "service" | "date" | "practitioner"> & { time: string };
}) {
  const [setting, setSetting] = useState("");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<PolicyResult | "pending" | "failed" | null>(null);
  const selected = setting === "" ? undefined : policy.settings[Number(setting)]?.change;
  const useSuggestion = setting === "suggested";
  const needsValue = selected !== undefined && selected.field !== "eligibility";

  function manualChange(change: PolicyControls["settings"][number]["change"]): PolicyChange {
    if (change.field === "eligibility") return change;
    return { ...change, value: /^\d+$/.test(value.trim()) ? Number(value) : Number.NaN };
  }

  async function preview() {
    setResult("pending");
    try {
      setResult(
        await policy.preview(useSuggestion ? suggested : selected ? [manualChange(selected)] : []),
      );
    } catch {
      setResult("failed");
    }
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
            void preview();
          }}
        >
          <label htmlFor="policy-setting">Setting to preview</label>
          <select
            id="policy-setting"
            value={setting}
            disabled={result === "pending"}
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
                disabled={result === "pending"}
                aria-invalid={typeof result === "object" && result !== null && !result.ok}
                onChange={(event) => {
                  setValue(event.target.value);
                  setResult(null);
                }}
              />
            </>
          )}
          {selected?.field === "eligibility" && <p>Preview eligibility for any patient.</p>}
          <div className="policy-actions">
            <button type="submit" disabled={result === "pending"}>
              Preview change
            </button>
            <button
              type="button"
              className="secondary"
              disabled={result === "pending"}
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
          {result === "pending"
            ? "Checking policy preview…"
            : result === "failed"
              ? "Could not check the policy preview."
              : result?.ok
                ? "Policy preview ready."
                : result?.issues.map(({ message }) => message).join(" ")}
        </p>
        {typeof result === "object" && result?.ok && (
          <div className="policy-comparison">
            <p>
              <strong>Original request</strong> · {request.service} · {request.date} at{" "}
              {request.time} · {request.practitioner}
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
