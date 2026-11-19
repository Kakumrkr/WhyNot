import { useRef, useState } from "react";
import type { SlotCheck } from "./adapter/staticAdapter.js";

type Blocked = Extract<SlotCheck, { status: "blocked" }>;
type Alternative = Blocked["alternatives"][number];

function Sentences({ sentences }: { sentences: Blocked["narration"]["primary"]["sentences"] }) {
  return (
    <ul>
      {sentences.map(({ text, factIds }) => (
        <li key={factIds.join(" ")}>{text}</li>
      ))}
    </ul>
  );
}

function Alternatives({
  alternatives,
  search,
  onAlternative,
}: Pick<Blocked, "alternatives" | "search"> & {
  onAlternative: (alternative: Alternative) => void;
}) {
  const [chosen, setChosen] = useState<Alternative | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  return (
    <section className="card alternatives" aria-labelledby="alternatives-title">
      <h2 id="alternatives-title">Verified alternatives</h2>
      {alternatives.length > 0 ? (
        <ol className="alternative-list">
          {alternatives.map((alternative) => (
            <li key={alternative.title}>
              <h3>{alternative.title}</h3>
              <dl className="changes">
                {alternative.changes.map(({ label, from, to }) => (
                  <div key={label}>
                    <dt>{label} change</dt>
                    <dd>
                      {from} → {to}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setChosen(alternative);
                  dialog.current?.showModal();
                  cancel.current?.focus();
                }}
                aria-label={`Review alternative for ${alternative.title}`}
              >
                Review alternative
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="supporting">No verified alternatives to show.</p>
      )}
      <div className="search-note">
        <p>{search.note}</p>
        {search.coverage && (
          <p>
            Search window {search.coverage.from} to {search.coverage.to} ·{" "}
            {search.coverage.evaluated} requests checked
          </p>
        )}
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="alternative-dialog-title"
        aria-describedby="alternative-dialog-choice"
      >
        <h2 id="alternative-dialog-title">Check this alternative?</h2>
        <p id="alternative-dialog-choice">{chosen?.title}</p>
        <div className="dialog-actions">
          <button
            ref={cancel}
            className="secondary"
            type="button"
            onClick={() => dialog.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!chosen) return;
              dialog.current?.close();
              onAlternative(chosen);
            }}
          >
            Check alternative
          </button>
        </div>
      </dialog>
    </section>
  );
}

/** Render the projected, templated result and the engine's ordered alternatives. */
export function ExplanationJourney({
  result,
  onAlternative,
}: {
  result: Exclude<SlotCheck, { status: "invalid_request" }>;
  onAlternative: (alternative: Alternative) => void;
}) {
  if (result.status === "bookable")
    return (
      <section className="card outcome" aria-labelledby="bookable-title">
        <h2 id="bookable-title">Bookable in this demo</h2>
        <p className="supporting">
          {result.practitioner} can take this appointment. The playground only checks availability.
        </p>
      </section>
    );

  const { narration, candidates, alternatives, search } = result;
  return (
    <div className="outcome">
      <section className="card explanation" aria-labelledby="explanation-title">
        <h2 id="explanation-title">{narration.primary.label}</h2>
        <Sentences sentences={narration.primary.sentences} />
        {narration.guidance.map(({ text, factIds }) => (
          <p className="guidance" key={factIds.join(" ")}>
            {text}
          </p>
        ))}
        <details>
          <summary>{narration.details.label}</summary>
          {narration.details.groups.map(({ id, label, sentences }) => (
            <div key={id}>
              <h3>{label}</h3>
              <Sentences sentences={sentences} />
            </div>
          ))}
        </details>
        {candidates.length > 0 && (
          <details>
            <summary>Candidate blockers by practitioner</summary>
            <p className="supporting">
              Each practitioner’s lowest-weight candidate is shown with all its blockers.
            </p>
            {candidates.map(({ practitioner, room, equipment, blockers }) => (
              <div key={practitioner}>
                <h3>{practitioner}</h3>
                <p className="supporting">{equipment ? `${room} · ${equipment}` : room}</p>
                <ul>
                  {blockers.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        )}
      </section>
      <Alternatives alternatives={alternatives} search={search} onAlternative={onAlternative} />
    </div>
  );
}
