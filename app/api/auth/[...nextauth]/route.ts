// /app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"

// Prisma adapter kullandığın için Node runtime şart
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const { GET, POST } = handlers
