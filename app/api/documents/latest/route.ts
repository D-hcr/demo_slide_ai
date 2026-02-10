// /app/api/documents/latest/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { desc, eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.userId, session.user.id))
    .orderBy(desc(schema.documents.updatedAt))
    .limit(1)

  return NextResponse.json(rows[0] ?? null)
}
