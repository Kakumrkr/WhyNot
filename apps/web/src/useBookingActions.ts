import { useState } from "react";
import { hashKey, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookingRequest } from "@whynot/contracts";
import type { FullSelection } from "./adapter/fullSelection.js";
import { HttpError, type BookingReceipt, type HttpAdapter } from "./adapter/httpAdapter.js";

type Receipt = {
  booking: BookingReceipt;
  scope: string;
  request: BookingRequest;
  service: string;
  practitioner: string;
  when: string;
};
type Context = { api: HttpAdapter; selection: FullSelection };
type Action =
  | (Context & { kind: "book" })
  | (Context & { kind: "cancel"; receipt: Receipt })
  | (Context & { kind: "reset" });

export function appointmentKey({ view, requester, slot }: FullSelection) {
  return [view.scenarioId, "schedule", "slot", requester.audience, slot] as const;
}

/** Retain cancellation handles in this tab and reconcile every mutation with live queries. */
export function useBookingActions(selection: FullSelection | null) {
  const client = useQueryClient();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const mutation = useMutation({
    async mutationFn(action: Action) {
      const {
        api,
        selection: { slot, requester, display },
      } = action;
      if (action.kind === "book")
        return { kind: action.kind, result: await api.book(slot, requester, display) } as const;
      if (action.kind === "cancel")
        return {
          kind: action.kind,
          result: await api.cancel(action.receipt.booking.id, requester),
        } as const;
      return { kind: action.kind, result: await api.reset(requester) } as const;
    },
    async onSuccess(response, action) {
      const { selection: requested } = action;
      const scope = requested.view.scenarioId;
      const schedule = [scope, "schedule"];
      if (response.kind === "book" && response.result.status === "conflict") {
        const checked = response.result.check;
        const key = appointmentKey(requested);
        if (checked) {
          await client.cancelQueries({ queryKey: key, exact: true });
          client.setQueryData(key, checked);
          await client.invalidateQueries({
            queryKey: schedule,
            predicate: (query) => query.queryHash !== hashKey(key),
          });
        } else {
          await client.invalidateQueries({ queryKey: schedule });
        }
        return;
      }
      await client.invalidateQueries({ queryKey: action.kind === "reset" ? [scope] : schedule });
      if (response.kind === "book" && response.result.status === "confirmed") {
        const { booking } = response.result;
        setReceipts((current) => [
          ...current,
          {
            booking,
            scope,
            request: requested.slot,
            service: requested.view.service,
            practitioner:
              requested.display.practitioners?.get(booking.practitionerId) ??
              booking.practitionerId,
            when: `${requested.view.date} at ${requested.view.time}`,
          },
        ]);
      }
      if (action.kind === "cancel") {
        setReceipts((current) =>
          current.filter(({ booking }) => booking.id !== action.receipt.booking.id),
        );
      }
      if (action.kind === "reset") {
        setReceipts((current) => current.filter((receipt) => receipt.scope !== scope));
      }
    },
    async onError(_error, action) {
      // A lost or malformed response can follow a committed change.
      await client.invalidateQueries({ queryKey: [action.selection.view.scenarioId, "schedule"] });
    },
  });

  const action = mutation.variables;
  const sameScope = selection && action?.selection.view.scenarioId === selection.view.scenarioId;
  const sameRequester =
    sameScope &&
    action.selection.requester.audience === selection.requester.audience &&
    action.selection.requester.patientId === selection.requester.patientId;
  const currentAction =
    sameRequester &&
    (action.kind !== "book" ||
      hashKey(appointmentKey(action.selection)) === hashKey(appointmentKey(selection)))
      ? action.kind
      : undefined;
  let message = "";
  if (currentAction && mutation.isPending) {
    message =
      currentAction === "book"
        ? "Confirming appointment…"
        : currentAction === "cancel"
          ? "Cancelling appointment…"
          : "Resetting demo data…";
  } else if (currentAction && mutation.isError) {
    message =
      currentAction === "book"
        ? "The clinic could not confirm this appointment. Check availability before trying again."
        : currentAction === "cancel"
          ? "The clinic could not cancel this appointment."
          : mutation.error instanceof HttpError && mutation.error.code === "not_found"
            ? "Demo reset is disabled on this server."
            : "The clinic could not reset this demo.";
  } else if (currentAction && mutation.data?.kind === "cancel") {
    message = "Appointment cancelled.";
  } else if (currentAction && mutation.data?.kind === "reset") {
    message = "Demo data reset.";
  } else if (
    currentAction &&
    mutation.data?.kind === "book" &&
    mutation.data.result.status === "conflict"
  ) {
    const { code } = mutation.data.result;
    message =
      code === "booking_conflict"
        ? "The clinic could not book this request. Review the updated explanation above."
        : "Another change was in progress. Review availability before trying again.";
  }

  return {
    pending: mutation.isPending,
    message,
    confirmed:
      selection !== null &&
      receipts.some(
        (receipt) =>
          receipt.scope === selection.view.scenarioId &&
          hashKey([receipt.request]) === hashKey([selection.slot]),
      ),
    receipts: receipts.filter(
      (receipt) =>
        selection &&
        receipt.scope === selection.view.scenarioId &&
        (selection.requester.audience === "staff" ||
          selection.requester.patientId === receipt.request.patientId),
    ),
    run: mutation.mutate,
  };
}

export type BookingActions = ReturnType<typeof useBookingActions>;
