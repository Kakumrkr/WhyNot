import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { PolicyBodySchema } from "@whynot/contracts/api";
import type { FullSelection } from "./adapter/fullSelection.js";
import { HttpError, type HttpAdapter } from "./adapter/httpAdapter.js";
import {
  editableSettings,
  renderPolicy,
  type PolicyControls,
  type PolicyResult,
} from "./adapter/policyPreview.js";
import { appointmentKey } from "./useBookingActions.js";

const invalidPatch: PolicyResult = {
  ok: false,
  issues: [
    {
      code: "invalid_request",
      path: ["changes"],
      message: "Choose a policy setting and enter a valid value.",
    },
  ],
};

/** Query live scheduling state with separate keys for the request, role and scenario. */
export function useFullQueries(api: HttpAdapter, selection: FullSelection | null) {
  const scope = selection?.view.scenarioId;
  const audience = selection?.requester.audience;
  const { data: slots, isError: startsFailed } = useQuery({
    queryKey: [
      scope,
      "schedule",
      "availability",
      audience,
      selection?.view.date,
      selection?.identity,
    ],
    queryFn: selection
      ? ({ signal }) =>
          api.availability(selection.view.date, selection.identity, selection.requester, signal)
      : skipToken,
  });
  const {
    data: appointment,
    isError: checkFailed,
    isFetching: checking,
  } = useQuery({
    queryKey: selection ? appointmentKey(selection) : [scope, "schedule", "slot"],
    queryFn: selection
      ? ({ signal }) => api.evaluate(selection.slot, selection.requester, selection.display, signal)
      : skipToken,
  });
  const { data: range, isError: rangeFailed } = useQuery({
    queryKey: [scope, "schedule", "range", audience, selection?.range],
    queryFn: selection
      ? ({ signal }) =>
          api.explainRange(selection.range, selection.requester, selection.display, signal)
      : skipToken,
  });
  const { data: policies, isError: policyFailed } = useQuery({
    queryKey: [scope, "policies", audience],
    queryFn:
      selection && audience === "staff"
        ? ({ signal }) => api.policyVersions(selection.requester, signal)
        : skipToken,
  });
  const preview = useMutation({
    async mutationFn({ selected, changes }: { selected: FullSelection; changes: unknown }) {
      const response = await api.previewPolicy(selected.slot, changes, selected.requester);
      const versions =
        policies?.activeVersionId === response.activeVersionId
          ? policies
          : await api.policyVersions(selected.requester);
      const baseline = versions.versions.find(({ id }) => id === response.activeVersionId);
      if (!baseline) throw new Error("Missing preview policy version");
      return renderPolicy(response, baseline.content, selected.display);
    },
  });
  const active = policies?.versions.find(({ id }) => id === policies.activeVersionId);
  const policy: PolicyControls | null =
    active && selection && audience === "staff"
      ? {
          settings: editableSettings(active.content, selection.display),
          async preview(changes) {
            // Invalid form values fail the request schema before contacting the server.
            const patch = PolicyBodySchema.shape.changes.safeParse(changes);
            if (!patch.success) return invalidPatch;
            try {
              return {
                ok: true,
                value: await preview.mutateAsync({ selected: selection, changes: patch.data }),
              };
            } catch (error) {
              if (error instanceof HttpError && error.code === "invalid_request")
                return invalidPatch;
              throw error;
            }
          },
        }
      : null;
  return {
    starts: startsFailed ? ("failed" as const) : (slots ?? null),
    checked: checkFailed ? ("failed" as const) : (appointment ?? null),
    checking,
    calendar: rangeFailed ? ("failed" as const) : (range ?? null),
    policy,
    policyFailed: policyFailed || (policies !== undefined && active === undefined),
  };
}
