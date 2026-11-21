import { useEffect, useState } from "react";
import { hashKey, useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
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
export function useBookingActions(api: HttpAdapter, selection: FullSelection | null) {
  const client = useQueryClient();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const scope = selection?.view.scenarioId;
  const selectedKey = selection ? hashKey(appointmentKey(selection)) : null;
  useEffect(() => {
    if (scope)
      void client.invalidateQueries({ queryKey: [scope, "receipt"] }, { cancelRefetch: false });
  }, [client, scope, selectedKey]);
  const visibleReceipts = receipts.filter(
    (record) =>
      selection &&
      record.scope === scope &&
      (selection.requester.audience === "staff" ||
        selection.requester.patientId === record.request.patientId),
  );
  const checks = useQueries({
    queries: selection
      ? visibleReceipts.map(({ booking }) => ({
          queryKey: [scope, "receipt", selection.requester, booking.id],
          queryFn: ({ signal }: { signal: AbortSignal }) =>
            api.bookingReceipt(booking.id, selection.requester, signal),
          initialData: booking,
          refetchOnWindowFocus: true,
        }))
      : [],
  });
  const missing = visibleReceipts.filter((_record, index) => checks[index]?.data === null);
  useEffect(() => {
    if (!scope || missing.length === 0) return;
    const ids = new Set(missing.map(({ booking }) => booking.id));
    setReceipts((current) => current.filter(({ booking }) => !ids.has(booking.id)));
    void client.invalidateQueries({ queryKey: [scope, "schedule"] }, { cancelRefetch: false });
  }, [client, missing, scope]);
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
      await Promise.all([
        client.invalidateQueries({ queryKey: schedule }),
        ...(action.kind === "reset"
          ? [client.invalidateQueries({ queryKey: [scope, "policies"] })]
          : []),
      ]);
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
    async onError(error, action) {
      // A lost or malformed response can follow a committed change.
      await client.invalidateQueries({
        queryKey: [action.selection.view.scenarioId],
        predicate: ({ queryKey: [, kind] }) =>
          kind === "schedule" ||
          (action.kind !== "book" && kind === "receipt") ||
          (action.kind === "reset" && kind === "policies"),
      });
      if (action.kind === "cancel" && error instanceof HttpError && error.code === "not_found")
        setReceipts((current) =>
          current.filter(({ booking }) => booking.id !== action.receipt.booking.id),
        );
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
          ? mutation.error instanceof HttpError && mutation.error.code === "not_found"
            ? "This booking is no longer on the clinic schedule."
            : "The clinic did not confirm the cancellation."
          : mutation.error instanceof HttpError && mutation.error.code === "not_found"
            ? "Demo reset is disabled on this server."
            : "The clinic did not confirm the reset.";
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

  const activeReceipts = visibleReceipts.flatMap((receipt, index) =>
    checks[index]?.data === null
      ? []
      : [{ ...receipt, verified: checks[index]?.isSuccess === true }],
  );
  return {
    pending: mutation.isPending,
    message,
    confirmed:
      selection !== null &&
      activeReceipts.some(
        ({ request, verified }) => verified && hashKey([request]) === hashKey([selection.slot]),
      ),
    receipts: activeReceipts,
    run: mutation.mutate,
  };
}

export type BookingActions = ReturnType<typeof useBookingActions>;
