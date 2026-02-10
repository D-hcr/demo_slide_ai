// /lib/db.ts
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL missing")

export const pool = new Pool({
  connectionString,
  // Neon için genelde SSL gerekir
  ssl: { rejectUnauthorized: false },
})

export const db = drizzle(pool)
