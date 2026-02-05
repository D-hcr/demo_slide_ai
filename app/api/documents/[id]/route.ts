import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** -------------------------
 * Artifact helpers (backward compatible)
 * --------------------------*/

function isArtifactEnvelope(content: any): boolean {
  return !!content && typeof content === "object" && !!content.artifact
}

function normalizeSlidesArray(input: any): { slides: any[]; changed: boolean } {
  const arr = Array.isArray(input) ? input : []
  let changed = false

  const slides = arr.map((s, idx) => {
    let id = s?.id

    // id'yi her koşulda string yap
    if (typeof id === "number") {
      id = String(id)
      changed = true
    }

    const idOk = typeof id === "string" && id.trim().length > 0
    if (!idOk) {
      id = crypto.randomUUID()
      changed = true
    }

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

function extractDeckFromContent(doc: {
  id: string
  title: string
  themeName: string | null
  content: any
  version?: number | null
  updatedAt?: any
}) {
  // NEW: { artifact: { state: { deck } } }
  if (isArtifactEnvelope(doc.content)) {
    const deck = doc.content?.artifact?.state?.deck
    const slidesRaw = deck?.slides
    const norm = normalizeSlidesArray(slidesRaw)

    const historyRaw = doc.content?.artifact?.state?.history
    const history = Array.isArray(historyRaw) ? historyRaw : []

    return {
      deck: {
        id: doc.id,
        title: deck?.title ?? doc.title,
        slides: norm.slides,
        themeName: deck?.themeName ?? doc.themeName ?? "Default",
        updatedAt: (doc as any).updatedAt,
      },
      history,
      norm,
      artifact: doc.content?.artifact,
    }
  }

  // LEGACY: Slide[] array
  const norm = normalizeSlidesArray(doc.content)
  return {
    deck: {
      id: doc.id,
      title: doc.title,
      slides: norm.slides,
      themeName: doc.themeName ?? "Default",
      updatedAt: (doc as any).updatedAt,
    },
    history: [],
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
  historyOverride?: any[] | null
  metaLastAction?: string
}) {
  const now = new Date().toISOString()

  const prev = args.prevArtifact
  const prevVersion = typeof prev?.version === "number" ? prev.version : 1
  const nextVersion = args.bumpVersion ? prevVersion + 1 : prevVersion

  const prevDeck = prev?.state?.deck
  const prevHistory =
    Array.isArray(args.historyOverride)
      ? args.historyOverride
      : Array.isArray(prev?.state?.history)
        ? prev.state.history
        : []

  const nextDeck = {
    id: args.docId,
    title: args.title,
    slides: args.slides,
    themeName: args.themeName,
  }

  const nextHistory =
    args.pushHistory && prevDeck
      ? [prevDeck, ...prevHistory].slice(0, 20) // son 20 snapshot
      : prevHistory

  return {
    artifact: {
      id: prev?.id ?? args.docId,
      type: "slides",
      title: args.title,
      version: nextVersion,
      meta: {
        status: "ready",
        lastAction: args.metaLastAction ?? (args.pushHistory ? "update" : "manual-edit"),
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

/* ======================= */
/* UNDO (POST)             */
/* ======================= */
/**
 * Body:
 * { action: "undo" }
 */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Document ID missing" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const action = body?.action

  if (action !== "undo") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const existing = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, themeName: true, content: true, version: true, updatedAt: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // legacy ise önce migrate edelim ki undo mantıklı olsun
  const extracted = extractDeckFromContent({
    id: existing.id,
    title: existing.title,
    themeName: existing.themeName,
    content: existing.content,
    version: existing.version,
    updatedAt: existing.updatedAt,
  })

  let artifact = extracted.artifact

  if (!isArtifactEnvelope(existing.content)) {
    const migrated = buildArtifactEnvelope({
      docId: existing.id,
      title: extracted.deck.title,
      themeName: extracted.deck.themeName,
      slides: extracted.deck.slides,
      prevArtifact: null,
      bumpVersion: false,
      pushHistory: false,
      historyOverride: [],
      metaLastAction: "create",
    })

    await prisma.document.update({
      where: { id: existing.id, userId: session.user.id },
      data: {
        content: JSON.parse(JSON.stringify(migrated)),
        artifactType: "slides",
      },
    })

    artifact = migrated.artifact
  }

  const history = Array.isArray(artifact?.state?.history) ? artifact.state.history : []
  if (history.length === 0) {
    return NextResponse.json({ error: "Nothing to undo" }, { status: 400 })
  }

  const prevDeck = history[0]
  const nextHistory = history.slice(1)

  // prevDeck içindeki slides normalize (id/string vs)
  const norm = normalizeSlidesArray(prevDeck?.slides)
  const fixedPrevDeck = {
    ...prevDeck,
    slides: norm.slides,
    id: existing.id,
    title: prevDeck?.title ?? existing.title,
    themeName: prevDeck?.themeName ?? existing.themeName ?? "Default",
  }

  const nextContent = buildArtifactEnvelope({
    docId: existing.id,
    title: fixedPrevDeck.title,
    themeName: fixedPrevDeck.themeName,
    slides: fixedPrevDeck.slides,
    prevArtifact: artifact,
    bumpVersion: true,
    pushHistory: false, // undo = history tüketiyoruz, yeni snapshot eklemiyoruz
    historyOverride: nextHistory,
    metaLastAction: "undo",
  })

  const updated = await prisma.document.update({
    where: { id: existing.id, userId: session.user.id },
    data: {
      title: nextContent.artifact.title,
      themeName: nextContent.artifact.state.deck.themeName,
      content: JSON.parse(JSON.stringify(nextContent)),
      version: { increment: 1 },
      artifactType: "slides",
    },
  })

  const out = extractDeckFromContent({
    id: updated.id,
    title: updated.title,
    themeName: updated.themeName,
    content: updated.content,
    version: updated.version,
    updatedAt: (updated as any).updatedAt,
  })

  return NextResponse.json({
    ok: true,
    deck: out.deck,
    historyLen: Array.isArray(out.history) ? out.history.length : 0,
    version: updated.version,
  })
}

/* ======================= */
/* UPDATE DOCUMENT (PATCH) */
/* ======================= */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Document ID missing" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const { title, slides, themeName } = body ?? {}

  if (!Array.isArray(slides)) {
    return NextResponse.json({ error: "Invalid slides payload" }, { status: 400 })
  }

  // mevcut doc + content oku (artifact varsa version/history koruyacağız)
  const existing = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, themeName: true, content: true, version: true, updatedAt: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extracted = extractDeckFromContent({
    id: existing.id,
    title: existing.title,
    themeName: existing.themeName,
    content: existing.content,
    version: existing.version,
    updatedAt: existing.updatedAt,
  })

  const norm = normalizeSlidesArray(slides)

  // content -> artifact envelope yaz
  const nextContent = buildArtifactEnvelope({
    docId: existing.id,
    title: typeof title === "string" && title.trim() ? title : extracted.deck.title,
    themeName: typeof themeName === "string" && themeName.trim() ? themeName : extracted.deck.themeName,
    slides: norm.slides,
    prevArtifact: extracted.artifact,
    bumpVersion: true,
    pushHistory: true,
    historyOverride: null,
    metaLastAction: "update",
  })

  const updated = await prisma.document.update({
    where: { id: existing.id, userId: session.user.id },
    data: {
      title: nextContent.artifact.title,
      themeName: nextContent.artifact.state.deck.themeName,
      content: JSON.parse(JSON.stringify(nextContent)),
      version: { increment: 1 },
      artifactType: "slides",
    },
  })

  const out = extractDeckFromContent({
    id: updated.id,
    title: updated.title,
    themeName: updated.themeName,
    content: updated.content,
    version: updated.version,
    updatedAt: (updated as any).updatedAt,
  })

  return NextResponse.json({
    id: updated.id,
    title: out.deck.title,
    slides: out.deck.slides,
    themeName: out.deck.themeName,
    updatedAt: (updated as any).updatedAt,
    version: updated.version,
    // ✅ ek bilgi (client isterse kullanır)
    historyLen: Array.isArray(out.history) ? out.history.length : 0,
  })
}

/* ======================= */
/* GET DOCUMENT (GET) */
/* ======================= */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, content: true, themeName: true, updatedAt: true, version: true },
  })

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extracted = extractDeckFromContent({
    id: document.id,
    title: document.title,
    themeName: document.themeName,
    content: document.content,
    version: document.version,
    updatedAt: document.updatedAt,
  })

  // LEGACY ise migrate
  if (!isArtifactEnvelope(document.content)) {
    const migrated = buildArtifactEnvelope({
      docId: document.id,
      title: extracted.deck.title,
      themeName: extracted.deck.themeName,
      slides: extracted.deck.slides,
      prevArtifact: null,
      bumpVersion: false,
      pushHistory: false,
      historyOverride: [],
      metaLastAction: "create",
    })

    await prisma.document.update({
      where: { id: document.id, userId: session.user.id },
      data: {
        content: JSON.parse(JSON.stringify(migrated)),
        artifactType: "slides",
      },
    })
  } else {
    // artifact içinde slide normalize gerekiyorsa kalıcı düzelt
    if (extracted.norm.changed) {
      const currentArtifact = (document.content as any)?.artifact
      const next = buildArtifactEnvelope({
        docId: document.id,
        title: extracted.deck.title,
        themeName: extracted.deck.themeName,
        slides: extracted.norm.slides,
        prevArtifact: currentArtifact,
        bumpVersion: false, // GET'te version artırma
        pushHistory: false,
        historyOverride: extracted.history,
        metaLastAction: "manual-edit",
      })

      await prisma.document.update({
        where: { id: document.id, userId: session.user.id },
        data: { content: JSON.parse(JSON.stringify(next)) },
      })
    }
  }

  return NextResponse.json({
    id: document.id,
    title: extracted.deck.title,
    slides: extracted.deck.slides,
    themeName: extracted.deck.themeName,
    updatedAt: document.updatedAt,
    version: document.version,

    // ✅ Undo için gerekli ek bilgiler
    historyLen: Array.isArray(extracted.history) ? extracted.history.length : 0,
    history: extracted.history, // istersen UI'da timeline yaparsın
  })
}

/* ======================= */
/* DELETE DOCUMENT (DELETE) */
/* ======================= */
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Document ID missing" }, { status: 400 })

  await prisma.document.delete({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
