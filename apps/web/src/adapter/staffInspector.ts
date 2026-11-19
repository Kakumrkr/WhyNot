import type { StaffEvaluation } from "@whynot/contracts";
import type { TemplateDisplay } from "@whynot/narrator";

/** Attach display labels to the staff trace without changing its facts or candidate order. */
export function staffInspector(
  result: Exclude<StaffEvaluation, { status: "invalid_request" }>,
  sentences: ReadonlyMap<string, string>,
  display: TemplateDisplay,
) {
  const trace = result.trace;
  if (!trace) throw new Error("Missing staff trace");
  const { candidates, facts, selected, reducedRows, searchNodes } = trace;
  const selectedIds = new Set(selected);
  const columns = facts.map(({ id, ruleId, subject }, index) => {
    const subjectName =
      display.practitioners?.get(subject.id) ??
      display.rooms?.get(subject.id) ??
      display.equipment?.get(subject.id);
    return {
      id,
      code: `F${index + 1}`,
      ruleId,
      text: sentences.get(id) ?? (subjectName ? `${ruleId} · ${subjectName}` : ruleId),
      primary: selectedIds.has(id),
    };
  });
  const codes = new Map(columns.map(({ id, code }) => [id, code]));
  const resources = new Map<string, typeof candidates>();
  for (const candidate of candidates) {
    const id = candidate.assignment.practitionerId;
    const rows = resources.get(id);
    if (rows) rows.push(candidate);
    else resources.set(id, [candidate]);
  }

  return {
    columns,
    resources: [...resources].map(([id, rows]) => ({
      id,
      label: display.practitioners?.get(id) ?? id,
      rows: rows.map(({ assignment: { roomId, equipmentId }, factIds }) => ({
        key: JSON.stringify([roomId, equipmentId]),
        room: display.rooms?.get(roomId) ?? roomId,
        equipment:
          equipmentId === null ? null : (display.equipment?.get(equipmentId) ?? equipmentId),
        violations: new Set(factIds),
      })),
    })),
    reducedRows: reducedRows.map((row) => row.map((id) => codes.get(id))),
    searchNodes,
    optimal: result.status === "blocked" ? result.explanation.optimal : null,
    basis: result.status === "blocked" ? result.explanation.basis : null,
    candidateCount: candidates.length,
    alternativeCount: trace.alternatives.length,
    candidatesTruncated: trace.candidatesTruncated,
    alternativesTruncated: trace.alternativesTruncated,
  };
}

export type StaffInspection = ReturnType<typeof staffInspector>;
