// /app/api/documents/[id]/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { and, eq } from "drizzle-orm"
import {
  buildSlidesArtifactEnvelope,
  extractSlidesStateFromDoc,
  isArtifactEnvelope,
  normalizeSlidesArray,
  pushSnapshot,
  redoState,
  undoState,
} from "@/lib/artifacts/slidesArtifact"
import type { DeckMeta } from "@/types/slide"

type Ctx = { params: Promise<{ id: string }> }

function normalizeMeta(input: any): DeckMeta | undefined {
  if (!input || typeof input !== "object") return undefined
  const topic = typeof input.topic === "string" ? input.topic.trim() : ""
  const audience = typeof input.audience === "string" ? input.audience.trim() : ""
  const tone = typeof input.tone === "string" ? input.tone.trim() : ""
  const meta: DeckMeta = {}
  if (topic) meta.topic = topic
  if (audience) meta.audience = audience
  if (tone) meta.tone = tone
  return Object.keys(meta).length ? meta : undefined
}

export async function GET(_req: Request, context: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params

  const rows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      content: schema.documents.content,
      themeName: schema.documents.themeName,
      updatedAt: schema.documents.updatedAt,
      version: schema.documents.version,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extracted = extractSlidesStateFromDoc(doc as any)

  // legacy -> migrate
  if (!isArtifactEnvelope(doc.content)) {
    const env = buildSlidesArtifactEnvelope({
      docId: doc.id,
      title: extracted.state.deck.title,
      themeName: extracted.state.deck.themeName,
      state: extracted.state,
      prevArtifact: null,
      bumpVersion: false,
      lastAction: "create",
    })

    await db
      .update(schema.documents)
      .set({ content: env as any, artifactType: "slides", updatedAt: new Date() })
      .where(and(eq(schema.documents.id, doc.id), eq(schema.documents.userId, session.user.id)))
  } else if (extracted.normChanged) {
    const env = buildSlidesArtifactEnvelope({
      docId: doc.id,
      title: extracted.state.deck.title,
      themeName: extracted.state.deck.themeName,
      state: extracted.state,
      prevArtifact: extracted.artifact,
      bumpVersion: false,
      lastAction: "manual-edit",
    })

    await db
      .update(schema.documents)
      .set({ content: env as any, updatedAt: new Date() })
      .where(and(eq(schema.documents.id, doc.id), eq(schema.documents.userId, session.user.id)))
  }

  return NextResponse.json({
    id: doc.id,
    title: extracted.state.deck.title,
    slides: extracted.state.deck.slides,
    themeName: extracted.state.deck.themeName,
    meta: extracted.state.deck.meta ?? null,
    updatedAt: doc.updatedAt,
    version: doc.version,
    pastLen: extracted.state.past.length,
    futureLen: extracted.state.future.length,
  })
}

export async function PATCH(req: Request, context: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const body = await req.json().catch(() => null)

  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : null
  const themeName =
    typeof body?.themeName === "string" && body.themeName.trim() ? body.themeName.trim() : null

  if (!Array.isArray(body?.slides)) {
    return NextResponse.json({ error: "Invalid slides payload" }, { status: 400 })
  }

  const incomingMeta = normalizeMeta(body?.meta)

  const rows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      themeName: schema.documents.themeName,
      content: schema.documents.content,
      version: schema.documents.version,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extracted = extractSlidesStateFromDoc(doc as any)

  const norm = normalizeSlidesArray(body.slides)
  const nextDeckTitle = title ?? extracted.state.deck.title
  const nextTheme = themeName ?? extracted.state.deck.themeName
  const nextMeta = incomingMeta !== undefined ? incomingMeta : (extracted.state.deck.meta ?? undefined)

  const nextState = pushSnapshot(
    {
      ...extracted.state,
      deck: {
        ...extracted.state.deck,
        title: nextDeckTitle,
        themeName: nextTheme,
        slides: norm.slides,
        meta: nextMeta,
      },
    },
    extracted.state.deck
  )

  const env = buildSlidesArtifactEnvelope({
    docId: doc.id,
    title: nextDeckTitle,
    themeName: nextTheme,
    state: nextState,
    prevArtifact: extracted.artifact,
    bumpVersion: true,
    lastAction: "update",
  })

  const nextVersion = (doc.version ?? 1) + 1

  await db
    .update(schema.documents)
    .set({
      title: nextDeckTitle,
      themeName: nextTheme,
      content: env as any,
      artifactType: "slides",
      version: nextVersion,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.documents.id, doc.id), eq(schema.documents.userId, session.user.id)))

  return NextResponse.json({
    id: doc.id,
    title: nextDeckTitle,
    slides: norm.slides,
    themeName: nextTheme,
    meta: nextMeta ?? null,
    version: nextVersion,
    pastLen: nextState.past.length,
    futureLen: nextState.future.length,
  })
}

export async function POST(req: Request, context: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const body = await req.json().catch(() => null)
  const action = body?.action

  if (action !== "undo" && action !== "redo") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const rows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      themeName: schema.documents.themeName,
      content: schema.documents.content,
      version: schema.documents.version,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extracted = extractSlidesStateFromDoc(doc as any)

  let nextState = extracted.state
  if (action === "undo") {
    if (!nextState.past.length) return NextResponse.json({ error: "Nothing to undo" }, { status: 400 })
    nextState = undoState(nextState)
  } else {
    if (!nextState.future.length) return NextResponse.json({ error: "Nothing to redo" }, { status: 400 })
    nextState = redoState(nextState)
  }

  const norm = normalizeSlidesArray(nextState.deck.slides)
  nextState = { ...nextState, deck: { ...nextState.deck, slides: norm.slides } }

  const env = buildSlidesArtifactEnvelope({
    docId: doc.id,
    title: nextState.deck.title,
    themeName: nextState.deck.themeName,
    state: nextState,
    prevArtifact: extracted.artifact,
    bumpVersion: true,
    lastAction: action,
  })

  const nextVersion = (doc.version ?? 1) + 1

  await db
    .update(schema.documents)
    .set({
      title: nextState.deck.title,
      themeName: nextState.deck.themeName,
      content: env as any,
      artifactType: "slides",
      version: nextVersion,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.documents.id, doc.id), eq(schema.documents.userId, session.user.id)))

  return NextResponse.json({
    ok: true,
    deck: nextState.deck,
    version: nextVersion,
    pastLen: nextState.past.length,
    futureLen: nextState.future.length,
  })
}

export async function DELETE(_req: Request, context: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params

  await db
    .delete(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))

  return NextResponse.json({ ok: true })
}
