import { demoClock } from "../clock/demoClock.js";
import { connectPostgres } from "../db/database.js";
import { seedRiverside } from "./seed.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Set DATABASE_URL to the local demo database before seeding");

const clock = demoClock(process.env.DEMO_DATE);
const connection = connectPostgres(databaseUrl);
try {
  await connection.migrate();
  const result = await seedRiverside(connection.db, clock);
  process.stdout.write(
    result === "seeded" ? "Seeded Riverside.\n" : "Riverside is already seeded.\n",
  );
} catch {
  process.stderr.write("Could not migrate or seed the demo database. Check the database setup.\n");
  process.exitCode = 1;
} finally {
  await connection.close();
}
