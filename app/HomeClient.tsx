"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { SlideDeck, DeckMeta } from "@/types/slide"

import ChatWorkspace from "@/components/chat/ChatWorkspace"
import SlideWorkspace from "@/components/slides/SlideWorkspace"
import LoginScreen from "@/components/auth/LoginScreen"
import { usePresentations } from "@/components/layout/presentations-context"

type SlideDeckResponse = {
  id?: string
  title?: string
  slides?: any[]
  content?: any
  themeName?: string
  meta?: DeckMeta
  updatedAt?: string
}

function normalizeDeck(raw: SlideDeckResponse): SlideDeck | null {
  const id = raw.id
  if (!id) return null

  const slidesFromSlides = Array.isArray(raw.slides) ? raw.slides : null
  const slidesFromLegacy = Array.isArray(raw.content) ? raw.content : null

  const slidesFromArtifact =
    raw.content &&
    typeof raw.content === "object" &&
    (raw.content as any).artifact?.state?.deck?.slides

  const slides =
    slidesFromSlides ??
    slidesFromLegacy ??
    (Array.isArray(slidesFromArtifact) ? slidesFromArtifact : [])

  const themeFromArtifact =
    raw.content &&
    typeof raw.content === "object" &&
    (raw.content as any).artifact?.state?.deck?.themeName

  const titleFromArtifact =
    raw.content &&
    typeof raw.content === "object" &&
    (raw.content as any).artifact?.state?.deck?.title

  const metaFromArtifact =
    raw.content &&
    typeof raw.content === "object" &&
    (raw.content as any).artifact?.state?.deck?.meta

  return {
    id,
    title: raw.title ?? titleFromArtifact ?? "Yeni Sunum",
    slides: slides as any[],
    themeName: raw.themeName ?? themeFromArtifact ?? "Default",
    meta: (raw.meta ?? metaFromArtifact ?? undefined) as any,
  }
}

export default function HomeClient({ session }: { session: any }) {
  const router = useRouter()
  const sp = useSearchParams()
  const docParam = sp.get("doc")

  const { refreshPresentations } = usePresentations()

  const [deckId, setDeckId] = useState<string | null>(null)
  const [deck, setDeck] = useState<SlideDeck | null>(null)
  const [deckVersion, setDeckVersion] = useState<number>(0)

  const [loading, setLoading] = useState(true)

  const lastLoadedDeckIdRef = useRef<string | null>(null)

  const hasSlides = useMemo(() => {
    return !!deckId && !!deck && Array.isArray(deck.slides) && deck.slides.length > 0
  }, [deckId, deck])

  async function loadDeckById(id: string) {
    if (lastLoadedDeckIdRef.current === id && deckId === id && deck) return

    const res = await fetch(`/api/documents/${id}`, { cache: "no-store" })
    if (!res.ok) return

    const raw: SlideDeckResponse = await res.json()
    const fixed = normalizeDeck(raw)
    if (!fixed) return

    lastLoadedDeckIdRef.current = fixed.id
    setDeck(fixed)
    setDeckId(fixed.id)
    setDeckVersion((v) => v + 1)
  }

  async function loadLatestDeck() {
    const res = await fetch("/api/documents/latest", { cache: "no-store" })
    if (!res.ok) return

    const raw: SlideDeckResponse | null = await res.json()
    if (!raw) return

    const fixed = normalizeDeck(raw)
    if (!fixed) return

    if (lastLoadedDeckIdRef.current === fixed.id && deckId === fixed.id && deck) return

    lastLoadedDeckIdRef.current = fixed.id
    setDeck(fixed)
    setDeckId(fixed.id)
    setDeckVersion((v) => v + 1)
  }

  // ✅ Chat ilk mesajda deck yoksa otomatik oluşturacak fonksiyon
  async function ensureDeckId(): Promise<string> {
    if (deckId) return deckId

    const res = await fetch("/api/documents", { method: "POST" })
    if (!res.ok) throw new Error("Failed to create document")

    const raw: SlideDeckResponse = await res.json()
    const fixed = normalizeDeck(raw)
    if (!fixed) throw new Error("Invalid created document")

    // Sidebar listesi anında güncellensin
    await refreshPresentations()

    lastLoadedDeckIdRef.current = fixed.id
    setDeckId(fixed.id)
    setDeck({
      ...fixed,
      slides: fixed.slides ?? [],
      title: fixed.title ?? "Yeni Sunum",
      meta: fixed.meta ?? {},
    })
    setDeckVersion((v) => v + 1)

    // ✅ URL’ye yaz ki About/Profile’dan dönünce aynı deck açılsın
    router.replace(`/?doc=${encodeURIComponent(fixed.id)}`)
    return fixed.id
  }

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        // ✅ doc query varsa onu yükle, yoksa latest
        if (docParam) await loadDeckById(docParam)
        else await loadLatestDeck()
      } finally {
        setLoading(false)
      }
    })()
    // docParam değişince deck değişsin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, docParam])

  if (!session) {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-100 flex">
        <LoginScreen />
      </div>
    )
  }

  // ✅ Full-screen loading yerine içerikte yumuşak loading (flash azalır)
  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-400">
        Sunum yükleniyor...
      </div>
    )
  }

  return (
    <div className="flex w-full h-full">
      <ChatWorkspace
        centered={!hasSlides}
        deckId={deckId}
        ensureDeckId={ensureDeckId}
        onGeneratedOrUpdated={async (raw: any | null) => {
          if (!raw) return

          const fixed = normalizeDeck(raw as any)
          if (!fixed) return

          lastLoadedDeckIdRef.current = fixed.id
          setDeck(fixed)
          setDeckId(fixed.id)
          setDeckVersion((v) => v + 1)

          await refreshPresentations()
          router.replace(`/?doc=${encodeURIComponent(fixed.id)}`)
        }}
      />

      {hasSlides && deck && deckId ? (
        <div className="flex-1 opacity-100 transition-all duration-700 ease-in-out overflow-hidden">
          <SlideWorkspace
            key={`${deckId}:${deckVersion}`}
            deck={deck}
            deckId={deckId}
            deckVersion={deckVersion}
            onSaved={refreshPresentations as any}
          />
        </div>
      ) : null}
    </div>
  )
}
