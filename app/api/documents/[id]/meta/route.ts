// /app/api/documents/[id]/meta/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { and, eq } from "drizzle-orm"

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Document ID missing" }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const { title, themeName } = body ?? {}

  if (title !== undefined && typeof title !== "string") {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 })
  }
  if (themeName !== undefined && typeof themeName !== "string") {
    return NextResponse.json({ error: "Invalid themeName" }, { status: 400 })
  }

  const now = new Date()

  const res = await db
    .update(schema.documents)
    .set({
      ...(title !== undefined ? { title } : {}),
      ...(themeName !== undefined ? { themeName } : {}),
      updatedAt: now,
    })
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))

  // res satır sayısı vs drivera göre değişebilir; garanti: select ile dön
  const updatedRows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      themeName: schema.documents.themeName,
      updatedAt: schema.documents.updatedAt,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  if (!updatedRows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(updatedRows[0])
}
