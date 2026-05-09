import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getServerEnv } from "@/lib/env";

import * as schema from "./schema";

let pool: Pool | null = null;

const lazyPool = new Proxy({} as Pool, {
  get(_target, property, receiver) {
    const currentPool = getPool();
    const value = Reflect.get(currentPool, property, receiver);

    return typeof value === "function" ? value.bind(currentPool) : value;
  },
});

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
  client: lazyPool,
  schema,
});
