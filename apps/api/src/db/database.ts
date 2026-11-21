import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";

export type Database = PgDatabase<PgQueryResultHKT>;

export const migrationsFolder = fileURLToPath(new URL("../../migrations/", import.meta.url));

function withStartupOptions(connectionString: string, options: string) {
  // node-postgres gives URI options precedence over the Pool's options field.
  const url = new URL(connectionString);
  const configured = url.searchParams.getAll("options").at(-1) || process.env.PGOPTIONS;
  url.searchParams.set("options", configured ? `${configured} ${options}` : options);
  return url.href;
}

/** Create a PostgreSQL connection pool and its typed query interface. */
export function connectPostgres(connectionString: string, options?: string) {
  const pool = new Pool({
    connectionString:
      options === undefined ? connectionString : withStartupOptions(connectionString, options),
  });
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
