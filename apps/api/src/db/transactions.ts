import type { Database } from "./database.js";

function sqlState(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? sqlState(error.cause) : undefined;
}

const maxRetries = 3;

/** Retry a whole transaction, including commit, for transient PostgreSQL failures. */
export async function serializable<T>(
  db: Database,
  operation: (tx: Database) => Promise<T>,
  retryExclusion = false,
): Promise<{ ok: true; value: T } | { ok: false }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return {
        ok: true,
        value: await db.transaction(operation, { isolationLevel: "serializable" }),
      };
    } catch (error) {
      const code = sqlState(error);
      if (code !== "40001" && code !== "40P01" && !(retryExclusion && code === "23P01"))
        throw error;
    }
  }
  return { ok: false };
}
