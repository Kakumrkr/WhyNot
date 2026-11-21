import { createApp } from "./app.js";
import { connectPostgres } from "./db/database.js";
import { clinics } from "./db/schema.js";
import { openScenarioDatabases } from "./seed/scenarioDatabases.js";

async function start() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL");
  const connection = connectPostgres(databaseUrl);
  let curated: Awaited<ReturnType<typeof openScenarioDatabases>> | undefined;
  try {
    const [clinic] = await connection.db.select({ date: clinics.demoDate }).from(clinics);
    if (!clinic) throw new Error("Missing Riverside seed");
    curated = await openScenarioDatabases(databaseUrl, connection.db, clinic.date);
    const app = createApp({
      db: connection.db,
      scenarios: curated.scenarios,
      allowedOrigins: ["http://127.0.0.1:5173", "http://127.0.0.1:4174"],
    });
    await app.listen({ host: "127.0.0.1", port: 8787 });
    process.stdout.write("Riverside API listening at http://127.0.0.1:8787.\n");
    const stop = async () => {
      try {
        await app.close();
      } finally {
        await Promise.all([connection.close(), curated?.close()]);
      }
    };
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      process.once(signal, () => {
        void stop().catch(() => {
          process.stderr.write("Could not close the Riverside API cleanly.\n");
          process.exitCode = 1;
        });
      });
    }
  } catch (error) {
    await Promise.all([connection.close(), curated?.close()]);
    throw error;
  }
}

try {
  await start();
} catch {
  process.stderr.write(
    "Could not start the Riverside API. Check DATABASE_URL, run pnpm db:seed, and ensure port 8787 is free.\n",
  );
  process.exitCode = 1;
}
