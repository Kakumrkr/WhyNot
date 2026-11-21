import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";

export type Database = PgDatabase<PgQueryResultHKT>;

export const migrationsFolder = fileURLToPath(new URL("../../migrations/", import.meta.url));

/** Create a PostgreSQL connection pool and its typed query interface. */
export function connectPostgres(connectionString: string, options?: string) {
  const pool = new Pool({ connectionString, options });
  const db = drizzle(pool);
  return {
    db,
    migrate: (migrationsSchema?: string) =>
      migrate(db, {
        migrationsFolder,
        ...(migrationsSchema === undefined ? {} : { migrationsSchema }),
      }),
    close: () => pool.end(),
  };
}
