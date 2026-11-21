import { useId, useRef, type ReactNode } from "react";
import type { FullSelection } from "./adapter/fullSelection.js";
import type { HttpAdapter } from "./adapter/httpAdapter.js";
import type { BookingActions } from "./useBookingActions.js";

function ConfirmAction({
  label,
  title,
  confirm,
  children,
  onConfirm,
  disabled,
}: {
  label: string;
  title: string;
  confirm: string;
  children: ReactNode;
  onConfirm: () => void;
  disabled: boolean;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        className={label === "Book appointment" ? undefined : "secondary"}
        type="button"
        disabled={disabled}
        onClick={() => {
          dialog.current?.showModal();
          back.current?.focus();
        }}
      >
        {label}
      </button>
      <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-description`}>{children}</p>
        <div className="dialog-actions">
          <button
            ref={back}
            type="button"
            className="secondary"
            onClick={() => dialog.current?.close()}
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => {
              dialog.current?.close();
              onConfirm();
            }}
          >
            {confirm}
          </button>
        </div>
      </dialog>
    </>
  );
}

/** Confirm writes explicitly and expose only the tab's scoped booking receipts. */
export function BookingPanel({
  api,
  selection,
  actions,
  canBook,
}: {
  api: HttpAdapter;
  selection: FullSelection;
  actions: BookingActions;
  canBook: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { view } = selection;
  function run(action: Parameters<BookingActions["run"]>[0]) {
    heading.current?.focus();
    actions.run(action);
  }

  return (
    <section className="card booking-panel" aria-labelledby="booking-title">
      <h2 id="booking-title" ref={heading} tabIndex={-1}>
        Demo bookings
      </h2>
      {canBook && (
        <ConfirmAction
          label="Book appointment"
          title="Confirm this appointment?"
          confirm="Confirm booking"
          disabled={actions.pending}
          onConfirm={() => run({ kind: "book", api, selection })}
        >
          {view.service} on {view.date} at {view.time} · {view.practitioner}
        </ConfirmAction>
      )}
      <p className="booking-status" role="status">
        {actions.message}
      </p>
      {actions.receipts.length > 0 ? (
        <ul className="booking-receipts">
          {actions.receipts.map((receipt) => (
            <li key={receipt.booking.id}>
              <p>
                <strong>
                  {receipt.verified ? "Appointment confirmed" : "Could not recheck this booking"}
                </strong>
              </p>
              <p>
                {receipt.service} · {receipt.when} · {receipt.practitioner}
              </p>
              <ConfirmAction
                label="Cancel appointment"
                title="Cancel this appointment?"
                confirm="Confirm cancellation"
                disabled={actions.pending}
                onConfirm={() => run({ kind: "cancel", api, selection, receipt })}
              >
                {receipt.service} on {receipt.when} · {receipt.practitioner}
              </ConfirmAction>
            </li>
          ))}
        </ul>
      ) : (
        !canBook && (
          <p className="supporting">No confirmed bookings in this tab for this scenario.</p>
        )
      )}
      {view.audience === "staff" && (
        <div className="booking-reset">
          <ConfirmAction
            label="Reset demo data"
            title="Reset this scenario’s demo data?"
            confirm="Reset scenario"
            disabled={actions.pending}
            onConfirm={() => run({ kind: "reset", api, selection })}
          >
            This restores the scenario’s starting bookings and active policy.
          </ConfirmAction>
        </div>
      )}
    </section>
  );
}
