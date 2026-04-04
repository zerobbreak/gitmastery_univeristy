import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let pool: pg.Pool | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new pg.Pool({
      connectionString,
      max: 5,
    });
  }
  return pool;
}

/** Drizzle client — lazy init for serverless and tooling that omits DATABASE_URL at import time. */
export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle({ client: getPool(), schema });
  }
  return dbInstance;
}

export { schema };
