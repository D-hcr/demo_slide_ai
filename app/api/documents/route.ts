// /app/api/documents/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { desc, eq, and } from "drizzle-orm"
import { buildSlidesArtifactEnvelope } from "@/lib/artifacts/slidesArtifact"

async function safeJson(req: Request): Promise<any> {
  const ct = req.headers.get("content-type") || ""
  if (!ct.includes("application/json")) return {}
  try {
    return await req.json()
  } catch {
    return {}
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const docs = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      updatedAt: schema.documents.updatedAt,
    })
    .from(schema.documents)
    .where(eq(schema.documents.userId, session.user.id))
    .orderBy(desc(schema.documents.updatedAt))

  return NextResponse.json(docs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await safeJson(req)
  const title =
    typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "New Presentation"
  const themeName =
    typeof body?.themeName === "string" && body.themeName.trim() ? body.themeName.trim() : "Default"

  const docId = crypto.randomUUID()

  const initialState = {
    deck: { id: docId, title, themeName, slides: [] as any[] },
    past: [] as any[],
    future: [] as any[],
  }

  const envelope = buildSlidesArtifactEnvelope({
    docId,
    title,
    themeName,
    state: initialState as any,
    prevArtifact: null,
    bumpVersion: false,
    lastAction: "create",
  })

  const now = new Date()

  await db.insert(schema.documents).values({
    id: docId,
    title,
    themeName,
    artifactType: "slides",
    version: 1,
    content: envelope as any,
    userId: session.user.id,
    createdAt: now,
    updatedAt: now,
  })

  const createdRows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      themeName: schema.documents.themeName,
      updatedAt: schema.documents.updatedAt,
      version: schema.documents.version,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, docId), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  return NextResponse.json(createdRows[0] ?? { id: docId, title, themeName, updatedAt: now, version: 1 })
}
