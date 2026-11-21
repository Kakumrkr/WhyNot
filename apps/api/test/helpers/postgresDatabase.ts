import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { connectPostgres } from "../../src/db/database.js";

export async function openPostgresTestDatabase() {
  const url = process.env.WHYNOT_TEST_DATABASE_URL;
  if (!url) throw new Error("Set WHYNOT_TEST_DATABASE_URL to a disposable PostgreSQL database");
  const schema = `whynot_test_${randomUUID().replaceAll("-", "")}`;
  const admin = connectPostgres(url);
  try {
    await admin.db.execute(sql`create schema ${sql.identifier(schema)}`);
  } catch (error) {
    await admin.close();
    throw error;
  }
  const connection = connectPostgres(url, `-c search_path=${schema},public`);
  return {
    db: connection.db,
    migrate: () => connection.migrate(schema),
    close: async () => {
      await connection.close();
      try {
        await admin.db.execute(sql`drop schema ${sql.identifier(schema)} cascade`);
      } finally {
        await admin.close();
      }
    },
  };
}
