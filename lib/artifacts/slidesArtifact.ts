// /home/hacer/Desktop/slied_project/slide-ai/lib/artifacts/slidesArtifact.ts
import type {
  Slide,
  SlideDeck,
  DocumentContent,
  SlidesArtifact,
  ArtifactMeta,
  DeckMeta,
} from "@/types/slide"

type AnyDoc = {
  id: string
  title: string
  themeName: string | null
  content: any
  version?: number | null
  updatedAt?: any
}

function isObject(x: any) {
  return !!x && typeof x === "object" && !Array.isArray(x)
}

function normalizeMeta(input: any): DeckMeta | undefined {
  if (!isObject(input)) return undefined
  const topic = typeof (input as any).topic === "string" ? (input as any).topic.trim() : ""
  const audience = typeof (input as any).audience === "string" ? (input as any).audience.trim() : ""
  const tone = typeof (input as any).tone === "string" ? (input as any).tone.trim() : ""

  const meta: DeckMeta = {}
  if (topic) meta.topic = topic
  if (audience) meta.audience = audience
  if (tone) meta.tone = tone

  return Object.keys(meta).length ? meta : undefined
}

export function isArtifactEnvelope(content: any): content is DocumentContent {
  return isObject(content) && isObject((content as any).artifact)
}

export function normalizeSlidesArray(input: any): { slides: Slide[]; changed: boolean } {
  const arr = Array.isArray(input) ? input : []
  let changed = false

  const used = new Set<string>()

  const slides: Slide[] = arr.map((s, idx) => {
    let id = (s as any)?.id

    // id string olsun
    if (typeof id === "number") {
      id = String(id)
      changed = true
    }
    if (typeof id !== "string" || !id.trim()) {
      id = crypto.randomUUID()
      changed = true
    }

    // uniq garanti
    if (used.has(id)) {
      id = `${id}-${idx}-${crypto.randomUUID()}`
      changed = true
    }
    used.add(id)

    const title =
      typeof (s as any)?.title === "string"
        ? (s as any).title
        : (s as any)?.title != null
          ? String((s as any).title)
          : "Başlıksız"

    const bulletsRaw = (s as any)?.bullets
    const bullets = Array.isArray(bulletsRaw)
      ? bulletsRaw.map((b: any) => String(b ?? "")).filter((x: string) => x.trim().length > 0)
      : []

    const imagePrompt =
      typeof (s as any)?.imagePrompt === "string"
        ? (s as any).imagePrompt
        : (s as any)?.imagePrompt != null
          ? String((s as any).imagePrompt)
          : ""

    const imageUrl = typeof (s as any)?.imageUrl === "string" ? (s as any).imageUrl : undefined

    const layout = (s as any)?.layout
    const safeLayout =
      layout === "text-left" || layout === "image-left" || layout === "full-image" ? layout : undefined

    const notes = typeof (s as any)?.notes === "string" ? (s as any).notes : undefined

    return {
      id,
      title,
      bullets,
      imagePrompt,
      imageUrl,
      layout: safeLayout,
      notes,
      style: isObject((s as any)?.style) ? (s as any).style : undefined,
    }
  })

  return { slides, changed }
}

/**
 * ✅ State modeli:
 * - deck: current
 * - past: undo stack (en yeni en başta)
 * - future: redo stack
 */
export type SlidesState = {
  deck: SlideDeck
  past: SlideDeck[]
  future: SlideDeck[]
}

export function extractSlidesStateFromDoc(doc: AnyDoc): {
  state: SlidesState
  artifact: SlidesArtifact | null
  normChanged: boolean
} {
  // NEW envelope
  if (isArtifactEnvelope(doc.content)) {
    const a = (doc.content as any).artifact as SlidesArtifact

    const deckRaw = a?.state?.deck
    const slidesRaw = deckRaw?.slides
    const norm = normalizeSlidesArray(slidesRaw)

    const pastRaw =
      Array.isArray((a as any)?.state?.past)
        ? (a as any).state.past
        : Array.isArray((a as any)?.state?.history) // backward compat
          ? (a as any).state.history
          : []

    const futureRaw = Array.isArray((a as any)?.state?.future) ? (a as any).state.future : []

    const meta = normalizeMeta((deckRaw as any)?.meta)

    const deck: SlideDeck = {
      id: doc.id,
      title: deckRaw?.title ?? doc.title,
      slides: norm.slides,
      themeName: deckRaw?.themeName ?? doc.themeName ?? "Default",
      meta,
    }

    return {
      state: {
        deck,
        past: Array.isArray(pastRaw) ? pastRaw : [],
        future: Array.isArray(futureRaw) ? futureRaw : [],
      },
      artifact: a,
      normChanged: norm.changed,
    }
  }

  // LEGACY: content Slide[] gibi
  const norm = normalizeSlidesArray(doc.content)
  const deck: SlideDeck = {
    id: doc.id,
    title: doc.title,
    slides: norm.slides,
    themeName: doc.themeName ?? "Default",
    meta: undefined,
  }

  return {
    state: { deck, past: [], future: [] },
    artifact: null,
    normChanged: norm.changed,
  }
}

export function buildSlidesArtifactEnvelope(args: {
  docId: string
  title: string
  themeName: string
  state: SlidesState
  prevArtifact?: SlidesArtifact | null
  bumpVersion?: boolean
  lastAction?: ArtifactMeta["lastAction"]
}) {
  const now = new Date().toISOString()

  const prev = args.prevArtifact
  const prevVersion = typeof prev?.version === "number" ? prev.version : 1
  const nextVersion = args.bumpVersion ? prevVersion + 1 : prevVersion

  const artifact: SlidesArtifact = {
    id: prev?.id ?? args.docId,
    type: "slides",
    title: args.title,
    version: nextVersion,
    meta: {
      status: "ready",
      lastAction: args.lastAction ?? "update",
      error: null,
    },
    state: {
      deck: {
        ...args.state.deck,
        id: args.docId,
        title: args.title,
        themeName: args.themeName,
        meta: normalizeMeta(args.state.deck.meta),
      },
      past: args.state.past,
      future: args.state.future,
    },
    updatedAt: now,
  }

  return { artifact }
}

// helpers
const SNAP_LIMIT = 20
export function pushSnapshot(state: SlidesState, snapshot: SlideDeck) {
  const past = [snapshot, ...state.past].slice(0, SNAP_LIMIT)
  return { ...state, past, future: [] } // ✅ edit/regenerate => redo sıfırlanır
}

export function undoState(state: SlidesState) {
  if (!state.past.length) return state
  const prev = state.past[0]
  const restPast = state.past.slice(1)
  const future = [state.deck, ...state.future].slice(0, SNAP_LIMIT)
  return { deck: prev, past: restPast, future }
}

export function redoState(state: SlidesState) {
  if (!state.future.length) return state
  const next = state.future[0]
  const restFuture = state.future.slice(1)
  const past = [state.deck, ...state.past].slice(0, SNAP_LIMIT)
  return { deck: next, past, future: restFuture }
}
