import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getServerEnv } from "@/lib/env";

import * as schema from "./schema";

let pool: Pool | null = null;

export function getPool() {
  if (pool) {
    return pool;
  }

  const env = getServerEnv();

  pool = new Pool({
    connectionString: env.databaseUrl,
  });

  return pool;
}

export const db = drizzle({
  client: getPool(),
  schema,
});
