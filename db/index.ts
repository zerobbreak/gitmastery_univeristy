import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getClient() {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    // Disable prefetch as it is not supported for "Transaction" pool mode
    client = postgres(connectionString, { prepare: false });
  }
  return client;
}

/** Drizzle client — lazy init for serverless and tooling that omits DATABASE_URL at import time. */
export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle({ client: getClient(), schema });
  }
  return dbInstance;
}

export { schema };
