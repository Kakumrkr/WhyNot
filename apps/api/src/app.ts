import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { demoPatientHeader, demoRoleHeader, type ApiErrorCode } from "@whynot/contracts/api";
import fastify, { LogController, type FastifyReply, type FastifyServerOptions } from "fastify";
import type { Database } from "./db/database.js";
import { ApiError, apiError } from "./http.js";
import { registerBookings } from "./routes/bookings.js";
import { registerClinic } from "./routes/clinic.js";
import { registerExplanations } from "./routes/explanations.js";
import { registerPolicies } from "./routes/policies.js";
import { registerReset } from "./routes/reset.js";

type AppOptions = {
  db: Database;
  allowedOrigins?: readonly string[];
  resetEnabled?: boolean;
  logger?: FastifyServerOptions["logger"];
};
const frameworkCodes: ReadonlyMap<number, ApiErrorCode> = new Map([
  [400, "invalid_request"],
  [404, "not_found"],
  [413, "payload_too_large"],
  [415, "unsupported_media_type"],
  [429, "rate_limited"],
]);

/** Create the synthetic appointment API with an injected database and no listening socket. */
export function createApp({
  db,
  allowedOrigins = [],
  resetEnabled = process.env.DEMO_RESET_ENABLED === "true",
  logger = false,
}: AppOptions) {
  const app = fastify({
    logger,
    logController: new LogController({ disableRequestLogging: true }),
    requestIdHeader: false,
    trustProxy: false,
    bodyLimit: 32 * 1024,
    // The default low-level handler logs the parser error, which can include the raw packet.
    clientErrorHandler: (_error, socket) => socket.destroy(),
    frameworkErrors: (error, _request, reply: FastifyReply) => {
      const { status, body } = apiError(
        frameworkCodes.get(error.statusCode ?? 0) ?? "internal_error",
      );
      return reply.header("cache-control", "no-store").code(status).send(body);
    },
  });
  app.setErrorHandler((error, request, reply) => {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 0;
    const code =
      error instanceof ApiError ? error.code : (frameworkCodes.get(statusCode) ?? "internal_error");
    if (code === "internal_error") request.log.error("API request failed");
    const { status, body } = apiError(code);
    return reply.code(status).send(body);
  });
  app.setNotFoundHandler((_request, reply) => {
    const { status, body } = apiError("not_found");
    return reply.code(status).send(body);
  });
  const origins = new Set(allowedOrigins);
  app.addHook("onRequest", async (request, reply) => {
    reply.header("cache-control", "no-store");
    const { origin } = request.headers;
    if (origin !== undefined && !origins.has(origin)) throw new ApiError("forbidden");
    if (
      request.method === "OPTIONS" &&
      (origin === undefined || !request.headers["access-control-request-method"])
    )
      throw new ApiError("invalid_request");
  });
  app.register(cors, {
    origin: [...origins],
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["content-type", demoRoleHeader, demoPatientHeader],
    logLevel: "silent",
  });
  app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    errorResponseBuilder: () => new ApiError("rate_limited"),
  });
  app.register((routes, _options, done) => {
    registerClinic(routes, db);
    registerExplanations(routes, db);
    registerBookings(routes, db);
    registerPolicies(routes, db);
    if (resetEnabled) registerReset(routes, db);
    done();
  });
  return app;
}
