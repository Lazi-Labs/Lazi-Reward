import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let instance: Db | undefined;

function getDb(): Db {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    instance = drizzle(neon(url), { schema });
  }
  return instance;
}

// Lazy proxy: the connection is created on first query, not at import time.
// `next build` evaluates route modules while collecting page data, and a
// module-level throw there fails the whole build even though the DB is never
// touched during the build.
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
export { schema };
