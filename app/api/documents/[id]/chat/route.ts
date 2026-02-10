// /app/api/documents/[id]/chat/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { and, asc, desc, eq } from "drizzle-orm"
import { runDeckChatCommand } from "@/lib/deckChat"
import {
  buildSlidesArtifactEnvelope,
  extractSlidesStateFromDoc,
  pushSnapshot,
  normalizeSlidesArray,
} from "@/lib/artifacts/slidesArtifact"

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params

  const docs = await db
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

  const doc = docs[0]
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const msgs = await db
    .select({
      id: schema.chatMessages.id,
      role: schema.chatMessages.role,
      content: schema.chatMessages.content,
      createdAt: schema.chatMessages.createdAt,
    })
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.documentId, id))
    .orderBy(asc(schema.chatMessages.createdAt))

  const extracted = extractSlidesStateFromDoc(doc as any)

  return NextResponse.json({
    messages: msgs,
    deck: {
      id: doc.id,
      title: extracted.state.deck.title,
      slides: extracted.state.deck.slides,
      themeName: extracted.state.deck.themeName,
      meta: extracted.state.deck.meta ?? null,
      updatedAt: doc.updatedAt,
      version: doc.version,
      pastLen: extracted.state.past.length,
      futureLen: extracted.state.future.length,
    },
  })
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const body = await req.json().catch(() => null)
  const text = body?.text

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 })
  }

  const docs = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      content: schema.documents.content,
      themeName: schema.documents.themeName,
      version: schema.documents.version,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const doc = docs[0]
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 1) user message kaydet
  await db.insert(schema.chatMessages).values({
    id: crypto.randomUUID(),
    documentId: id,
    role: "user",
    content: text,
    createdAt: new Date(),
  })

  // 2) son 30 mesajı al
  const recentDesc = await db
    .select({ role: schema.chatMessages.role, content: schema.chatMessages.content })
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.documentId, id))
    .orderBy(desc(schema.chatMessages.createdAt))
    .limit(30)

  const recent = recentDesc.reverse()

  // 3) mevcut deck state
  const extracted = extractSlidesStateFromDoc(doc as any)
  const safeSlides = normalizeSlidesArray(extracted.state.deck.slides).slides

  const currentDeck = {
    ...extracted.state.deck,
    slides: safeSlides,
  }

  // 4) LLM komut çalıştır
  const result = await runDeckChatCommand({
    userText: text,
    deck: currentDeck,
    messages: recent as any,
  })

  // 5) deck güncellendiyse DB’ye yaz
  let nextState = extracted.state
  let nextVersion = doc.version ?? 1

  if (result.updatedDeck) {
    const norm = normalizeSlidesArray(result.updatedDeck.slides)
    const nextDeck = {
      ...currentDeck,
      ...result.updatedDeck,
      slides: norm.slides,
      meta: result.updatedDeck.meta ?? currentDeck.meta,
    }

    nextState = pushSnapshot({ ...extracted.state, deck: nextDeck }, extracted.state.deck)

    const env = buildSlidesArtifactEnvelope({
      docId: doc.id,
      title: nextDeck.title,
      themeName: nextDeck.themeName,
      state: nextState,
      prevArtifact: extracted.artifact,
      bumpVersion: true,
      lastAction: "update",
    })

    nextVersion = (doc.version ?? 1) + 1

    await db
      .update(schema.documents)
      .set({
        title: nextDeck.title,
        themeName: nextDeck.themeName,
        content: env as any,
        artifactType: "slides",
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.documents.id, doc.id), eq(schema.documents.userId, session.user.id)))
  }

  // 6) assistant mesajını kaydet
  await db.insert(schema.chatMessages).values({
    id: crypto.randomUUID(),
    documentId: id,
    role: "assistant",
    content: result.assistantText,
    createdAt: new Date(),
  })

  // 7) güncel messages dön (client senkron)
  const msgs = await db
    .select({
      id: schema.chatMessages.id,
      role: schema.chatMessages.role,
      content: schema.chatMessages.content,
      createdAt: schema.chatMessages.createdAt,
    })
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.documentId, id))
    .orderBy(asc(schema.chatMessages.createdAt))

  // doc’u tekrar çekmeden extracted state ile dönüyoruz
  return NextResponse.json({
    messages: msgs,
    deck: {
      id: doc.id,
      title: (result.updatedDeck?.title ?? extracted.state.deck.title) ?? doc.title,
      slides: result.updatedDeck?.slides ?? extracted.state.deck.slides ?? [],
      themeName: result.updatedDeck?.themeName ?? extracted.state.deck.themeName ?? (doc.themeName ?? "Default"),
      meta: result.updatedDeck?.meta ?? extracted.state.deck.meta ?? null,
      updatedAt: new Date(),
      version: nextVersion,
      pastLen: nextState.past.length,
      futureLen: nextState.future.length,
    },
  })
}
