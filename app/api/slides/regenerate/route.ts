// /app/api/slides/regenerate/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { and, eq } from "drizzle-orm"
import { regenerateSlideText, regenerateSlideImagePrompt } from "@/lib/groq"
import type { Slide } from "@/types/slide"
import {
  buildSlidesArtifactEnvelope,
  extractSlidesStateFromDoc,
  pushSnapshot,
} from "@/lib/artifacts/slidesArtifact"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { documentId, slideId, mode } = body ?? {}

  if (!documentId || !slideId || (mode !== "text" && mode !== "imagePrompt")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const rows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      themeName: schema.documents.themeName,
      content: schema.documents.content,
      version: schema.documents.version,
      userId: schema.documents.userId,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, documentId), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extracted = extractSlidesStateFromDoc(doc as any)
  const deck = extracted.state.deck
  const meta = deck.meta
  const slides: Slide[] = Array.isArray(deck.slides) ? deck.slides : []

  const idx = slides.findIndex((s) => s.id === slideId)
  if (idx === -1) return NextResponse.json({ error: "Slide not found" }, { status: 404 })

  const target = slides[idx]

  let patch: Partial<Slide> = {}
  if (mode === "text") patch = await regenerateSlideText(target, meta)
  if (mode === "imagePrompt") patch = await regenerateSlideImagePrompt(target, meta)

  const nextSlides = slides.map((s, i) => (i === idx ? { ...s, ...patch } : s))
  const nextDeck = { ...deck, slides: nextSlides }

  const nextState = pushSnapshot({ ...extracted.state, deck: nextDeck }, extracted.state.deck)

  const env = buildSlidesArtifactEnvelope({
    docId: doc.id,
    title: nextDeck.title,
    themeName: nextDeck.themeName,
    state: nextState,
    prevArtifact: extracted.artifact,
    bumpVersion: true,
    lastAction: "regenerate",
  })

  const nextVersion = (doc.version ?? 1) + 1

  await db
    .update(schema.documents)
    .set({
      content: env as any,
      version: nextVersion,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.documents.id, doc.id), eq(schema.documents.userId, session.user.id)))

  return NextResponse.json({
    slide: nextSlides[idx],
    version: nextVersion,
    pastLen: nextState.past.length,
    futureLen: nextState.future.length,
  })
}
