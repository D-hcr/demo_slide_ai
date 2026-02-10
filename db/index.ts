// /db/index.ts
import * as schema from "./schema"

// Edge (Cloudflare / Vercel Edge) -> neon-http
import { neon } from "@neondatabase/serverless"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http"

// Node.js runtime -> node-postgres
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("Missing DATABASE_URL env var")

const isEdge = process.env.NEXT_RUNTIME === "edge"

// ✅ Edge: HTTP driver (serverless/edge uyumlu)
const edgeDb = drizzleNeon(neon(DATABASE_URL), { schema })

// ✅ Node: pg Pool (puppeteer gibi node-only işler için stabil)
const nodePool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const nodeDb = drizzlePg(nodePool, { schema })

export const db = isEdge ? edgeDb : nodeDb
export { schema }
