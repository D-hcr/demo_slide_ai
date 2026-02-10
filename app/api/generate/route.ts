// /app/api/generate/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { generateSlides } from "@/lib/groq"
import { buildSlidesArtifactEnvelope } from "@/lib/artifacts/slidesArtifact"

function withIds(slides: any[]) {
  return (slides ?? []).map((s: any) => ({
    ...s,
    id: crypto.randomUUID(),
  }))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { topic, audience, tone } = await req.json().catch(() => ({} as any))
  if (!topic || typeof topic !== "string") {
    return NextResponse.json({ error: "Invalid topic" }, { status: 400 })
  }

  const rawDeck = await generateSlides(topic, { topic, audience, tone })
  const slides = withIds(rawDeck.slides ?? [])

  const docId = crypto.randomUUID()

  const initialState = {
    deck: {
      id: docId,
      title: rawDeck.title ?? "Yeni Sunum",
      themeName: rawDeck.themeName ?? "Default",
      slides,
      meta: { topic, audience, tone },
    },
    past: [],
    future: [],
  }

  const env = buildSlidesArtifactEnvelope({
    docId,
    title: initialState.deck.title,
    themeName: initialState.deck.themeName,
    state: initialState as any,
    prevArtifact: null,
    bumpVersion: false,
    lastAction: "create",
  })

  const now = new Date()

  await db.insert(schema.documents).values({
    id: docId,
    title: initialState.deck.title,
    themeName: initialState.deck.themeName,
    artifactType: "slides",
    version: 1,
    content: env as any,
    userId: session.user.id,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({
    id: docId,
    title: initialState.deck.title,
    slides,
    themeName: initialState.deck.themeName,
    meta: initialState.deck.meta,
  })
}
