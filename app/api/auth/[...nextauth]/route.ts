// /app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const { GET, POST } = handlers
