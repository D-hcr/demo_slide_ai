// /app/api/documents/[id]/duplicate/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { and, eq } from "drizzle-orm"
import {
  extractSlidesStateFromDoc,
  buildSlidesArtifactEnvelope,
  normalizeSlidesArray,
} from "@/lib/artifacts/slidesArtifact"

function deepCloneJson<T>(x: T): T {
  return JSON.parse(JSON.stringify(x))
}

function remapSlidesWithFreshIds(slides: any[]) {
  const arr = Array.isArray(slides) ? slides : []
  return arr.map((s) => ({
    ...s,
    id: crypto.randomUUID(), // ✅ yeni uniq id
  }))
}

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Document ID missing" }, { status: 400 })

  const rows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      themeName: schema.documents.themeName,
      content: schema.documents.content,
      artifactType: schema.documents.artifactType,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const src = rows[0]
  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extracted = extractSlidesStateFromDoc({
    id: src.id,
    title: src.title,
    themeName: src.themeName ?? "Default",
    content: src.content,
  } as any)

  // ✅ normalize + fresh ids
  const norm = normalizeSlidesArray(extracted.state.deck.slides)
  const freshSlides = remapSlidesWithFreshIds(norm.slides)

  const newDocId = crypto.randomUUID()
  const newTitle = `${src.title} (Kopya)`
  const newTheme = extracted.state.deck.themeName ?? src.themeName ?? "Default"

  const nextState = {
    deck: {
      id: newDocId,
      title: newTitle,
      themeName: newTheme,
      slides: freshSlides,
    },
    past: [],
    future: [],
  }

  const envelope = buildSlidesArtifactEnvelope({
    docId: newDocId,
    title: newTitle,
    themeName: newTheme,
    state: nextState as any,
    prevArtifact: null,
    bumpVersion: false,
    lastAction: "create",
  })

  const now = new Date()

  // ✅ Drizzle bazı driverlarda returning(selectObject) desteklemiyor.
  // En sağlam: insert + sonra select
  await db.insert(schema.documents).values({
    id: newDocId,
    title: newTitle,
    themeName: newTheme,
    artifactType: "slides",
    version: 1,
    content: deepCloneJson(envelope) as any,
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
    .where(and(eq(schema.documents.id, newDocId), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const created = createdRows[0]
  if (!created) {
    return NextResponse.json({ error: "Duplicate failed" }, { status: 500 })
  }

  return NextResponse.json(created)
}
