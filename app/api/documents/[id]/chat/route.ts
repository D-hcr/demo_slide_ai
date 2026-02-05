import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { runDeckChatCommand } from "@/lib/deckChat"

/** -------------------------
 * Artifact helpers (backward compatible)
 * --------------------------*/

function isArtifactEnvelope(content: any): boolean {
  return !!content && typeof content === "object" && !!content.artifact
}

/**
 * ✅ Slide id’lerini normalize eder:
 * - number -> string
 * - boş -> uuid
 * - duplicate -> uuid (kritik fix)
 */
function normalizeSlidesArray(input: any): { slides: any[]; changed: boolean } {
  const arr = Array.isArray(input) ? input : []
  let changed = false

  const used = new Set<string>()

  const slides = arr.map((s, idx) => {
    let id = s?.id

    // number -> string
    if (typeof id === "number") {
      id = String(id)
      changed = true
    }

    // string trim
    if (typeof id === "string") {
      const trimmed = id.trim()
      if (trimmed !== id) changed = true
      id = trimmed
    }

    // boş/invalid -> uuid
    const idOk = typeof id === "string" && id.length > 0
    if (!idOk) {
      id = crypto.randomUUID()
      changed = true
    }

    // ✅ duplicate -> uuid
    if (used.has(id)) {
      id = crypto.randomUUID()
      changed = true
    }
    used.add(id)

    const title =
      typeof s?.title === "string"
        ? s.title
        : s?.title != null
          ? String(s.title)
          : "Başlıksız"

    const bulletsRaw = s?.bullets
    const bullets = Array.isArray(bulletsRaw)
      ? bulletsRaw.map((b: any) => String(b ?? "")).filter((x: string) => x.trim().length > 0)
      : []

    const imagePrompt =
      typeof s?.imagePrompt === "string"
        ? s.imagePrompt
        : s?.imagePrompt != null
          ? String(s.imagePrompt)
          : ""

    return {
      ...s,
      id,
      title,
      bullets,
      imagePrompt,
      _order: typeof s?._order === "number" ? s._order : idx,
    }
  })

  return { slides, changed }
}

function extractDeck(doc: { id: string; title: string; themeName: string | null; content: any }) {
  if (isArtifactEnvelope(doc.content)) {
    const deck = doc.content?.artifact?.state?.deck
    const slidesRaw = deck?.slides
    const norm = normalizeSlidesArray(slidesRaw)

    return {
      deck: {
        id: doc.id,
        title: deck?.title ?? doc.title,
        slides: norm.slides,
        themeName: deck?.themeName ?? doc.themeName ?? "Default",
      },
      norm,
      artifact: doc.content?.artifact,
    }
  }

  const norm = normalizeSlidesArray(doc.content)
  return {
    deck: {
      id: doc.id,
      title: doc.title,
      slides: norm.slides,
      themeName: doc.themeName ?? "Default",
    },
    norm,
    artifact: null,
  }
}

function buildArtifactEnvelope(args: {
  docId: string
  title: string
  themeName: string
  slides: any[]
  prevArtifact?: any | null
  bumpVersion?: boolean
  pushHistory?: boolean
  lastAction?: "create" | "update" | "regenerate" | "manual-edit" | "export"
}) {
  const now = new Date().toISOString()

  const prev = args.prevArtifact
  const prevVersion = typeof prev?.version === "number" ? prev.version : 1
  const nextVersion = args.bumpVersion ? prevVersion + 1 : prevVersion

  const prevDeck = prev?.state?.deck
  const prevHistory = Array.isArray(prev?.state?.history) ? prev.state.history : []

  const nextDeck = {
    id: args.docId,
    title: args.title,
    slides: args.slides,
    themeName: args.themeName,
  }

  const nextHistory =
    args.pushHistory && prevDeck
      ? [prevDeck, ...prevHistory].slice(0, 20)
      : prevHistory

  return {
    artifact: {
      id: prev?.id ?? args.docId,
      type: "slides",
      title: args.title,
      version: nextVersion,
      meta: {
        status: "ready",
        lastAction: args.lastAction ?? (args.pushHistory ? "update" : "manual-edit"),
        error: null,
      },
      state: {
        deck: nextDeck,
        history: nextHistory,
      },
      updatedAt: now,
    },
  }
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
      title: true,
      content: true,
      themeName: true,
      updatedAt: true,
      version: true,
    },
  })

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extracted = extractDeck(doc)

  // legacy ise migrate
  if (!isArtifactEnvelope(doc.content)) {
    const migrated = buildArtifactEnvelope({
      docId: doc.id,
      title: extracted.deck.title,
      themeName: extracted.deck.themeName,
      slides: extracted.deck.slides,
      prevArtifact: null,
      bumpVersion: false,
      pushHistory: false,
      lastAction: "create",
    })

    await prisma.document.update({
      where: { id: doc.id, userId: session.user.id },
      data: {
        content: JSON.parse(JSON.stringify(migrated)),
        artifactType: "slides",
      },
    })
  } else {
    // artifact içindeki slides normalize gerekiyorsa kalıcı düzelt
    if (extracted.norm.changed) {
      const next = buildArtifactEnvelope({
        docId: doc.id,
        title: extracted.deck.title,
        themeName: extracted.deck.themeName,
        slides: extracted.norm.slides,
        prevArtifact: extracted.artifact,
        bumpVersion: false,
        pushHistory: false,
        lastAction: "manual-edit",
      })

      await prisma.document.update({
        where: { id: doc.id, userId: session.user.id },
        data: { content: JSON.parse(JSON.stringify(next)) },
      })
    }
  }

  return NextResponse.json({
    messages: doc.messages,
    deck: {
      id: doc.id,
      title: extracted.deck.title,
      slides: extracted.deck.slides,
      themeName: extracted.deck.themeName,
      updatedAt: doc.updatedAt,
      version: doc.version,
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

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, content: true, themeName: true, version: true },
  })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 1) user message kaydet
  await prisma.chatMessage.create({
    data: { documentId: id, role: "user", content: text },
  })

  // 2) son 30 mesajı al
  const recentDesc = await prisma.chatMessage.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { role: true, content: true },
  })
  const recent = recentDesc.reverse()

  // 3) mevcut deck'i content'ten çek (artifact/legacy fark etmez)
  const extracted = extractDeck(doc)

  // legacy ise ilk anda migrate (LLM update öncesi)
  let currentArtifact = extracted.artifact
  if (!isArtifactEnvelope(doc.content)) {
    const migrated = buildArtifactEnvelope({
      docId: doc.id,
      title: extracted.deck.title,
      themeName: extracted.deck.themeName,
      slides: extracted.deck.slides,
      prevArtifact: null,
      bumpVersion: false,
      pushHistory: false,
      lastAction: "create",
    })

    await prisma.document.update({
      where: { id: doc.id, userId: session.user.id },
      data: {
        content: JSON.parse(JSON.stringify(migrated)),
        artifactType: "slides",
      },
    })

    currentArtifact = migrated.artifact
  }

  const currentSlides = extracted.deck.slides

  // 4) LLM komut çalıştır
  const result = await runDeckChatCommand({
    userText: text,
    deck: {
      id: doc.id,
      title: extracted.deck.title,
      slides: currentSlides,
      themeName: extracted.deck.themeName,
    },
    messages: recent,
  })

  // 5) deck güncellendiyse DB’ye yaz (artifact envelope)
  if (result.updatedDeck) {
    // ✅ KRİTİK: normalizeSlidesArray artık duplicate id’leri de düzeltir
    const nextNorm = normalizeSlidesArray(result.updatedDeck.slides)

    const finalSlides =
      currentSlides.length > 0 && nextNorm.slides.length === 0 ? currentSlides : nextNorm.slides

    const nextTitle =
      typeof result.updatedDeck.title === "string" && result.updatedDeck.title.trim()
        ? result.updatedDeck.title
        : extracted.deck.title

    const nextTheme =
      typeof result.updatedDeck.themeName === "string" && result.updatedDeck.themeName.trim()
        ? result.updatedDeck.themeName
        : extracted.deck.themeName

    const nextContent = buildArtifactEnvelope({
      docId: doc.id,
      title: nextTitle,
      themeName: nextTheme,
      slides: finalSlides,
      prevArtifact: currentArtifact,
      bumpVersion: true,
      pushHistory: true,
      lastAction: "update",
    })

    await prisma.document.update({
      where: { id: doc.id, userId: session.user.id },
      data: {
        title: nextTitle,
        themeName: nextTheme,
        content: JSON.parse(JSON.stringify(nextContent)),
        version: { increment: 1 },
        artifactType: "slides",
      },
    })
  }

  // 6) assistant mesajını kaydet
  await prisma.chatMessage.create({
    data: {
      documentId: id,
      role: "assistant",
      content: result.assistantText,
    },
  })

  // 7) güncel state dön
  const outDoc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      content: true,
      themeName: true,
      updatedAt: true,
      version: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  })

  const outExtracted = outDoc ? extractDeck(outDoc) : null

  return NextResponse.json({
    messages: outDoc?.messages ?? [],
    deck: outDoc
      ? {
          id: outDoc.id,
          title: outExtracted?.deck.title ?? outDoc.title,
          slides: outExtracted?.deck.slides ?? [],
          themeName: outExtracted?.deck.themeName ?? outDoc.themeName ?? "Default",
          updatedAt: outDoc.updatedAt,
          version: outDoc.version,
        }
      : null,
  })
}
