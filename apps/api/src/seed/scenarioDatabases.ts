import { sql } from "drizzle-orm";
import { connectPostgres, type Database } from "../db/database.js";
import { seedScenario } from "./seed.js";

/** Open the independently persisted curated fixtures in the local Riverside database. */
export async function openScenarioDatabases(databaseUrl: string, base: Database, date: string) {
  const connections = new Map<string, ReturnType<typeof connectPostgres>>();
  const close = () => Promise.all([...connections.values()].map((scope) => scope.close()));
  const scenarios = new Map<string, Database>();
  try {
    for (let index = 1; index <= 11; index++) {
      const id = `H${index}`;
      const schema = `whynot_demo_h${index}`;
      // Drizzle uses this schema for its migration journal as well as the scoped tables.
      await base.execute(sql`create schema if not exists ${sql.identifier(schema)}`);
      const connection = connectPostgres(databaseUrl, `-c search_path=${schema},public`);
      connections.set(id, connection);
      await connection.migrate(schema);
      await seedScenario(connection.db, id, date);
      scenarios.set(id, connection.db);
    }
    return { scenarios, close };
  } catch (error) {
    await close();
    throw error;
  }
}
