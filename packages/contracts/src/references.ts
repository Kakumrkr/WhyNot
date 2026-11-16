import { z } from "zod";

/** Validate evaluation-local dictionaries and references without engine dependencies. */
export function checkReferences(
  ids: string[],
  references: { id: string; path: (string | number)[] }[],
  ctx: z.RefinementCtx,
): void {
  const known = new Set<string>();
  ids.forEach((id, index) => {
    if (known.has(id))
      ctx.addIssue({ code: "custom", path: ["facts", index, "id"], message: "Duplicate fact ID" });
    known.add(id);
  });
  references.forEach(({ id, path }) => {
    if (!known.has(id)) ctx.addIssue({ code: "custom", path, message: "Unknown fact reference" });
  });
}
