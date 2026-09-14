import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Reuse one connection pool across dev hot reloads instead of opening a new one per reload.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

// prepare: false is required by Supabase's pooler in transaction mode (port 6543).
const sql = globalForDb.sql ?? postgres(url, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
