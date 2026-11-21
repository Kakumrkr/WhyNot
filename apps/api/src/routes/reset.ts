import { ResetResponseSchema } from "@whynot/contracts/api";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { serializable } from "../db/transactions.js";
import { requireStaff } from "../demoRole.js";
import { ApiError } from "../http.js";
import { resetRiverside } from "../seed/seed.js";

/** Register the demo reset only when the server configuration enables it. */
export function registerReset(app: FastifyInstance, db: Database): void {
  app.post("/api/demo/reset", { config: { rateLimit: { max: 2 } } }, async (http) => {
    requireStaff(http);
    if (http.body !== undefined) throw new ApiError("invalid_request");
    const reset = await serializable(db, resetRiverside);
    if (!reset.ok) throw new ApiError("contended");
    return ResetResponseSchema.parse({ status: "reset" });
  });
}
