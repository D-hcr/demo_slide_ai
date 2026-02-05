"use client"

import { useEffect, useRef, useState } from "react"
import type { SlideDeck, Slide } from "@/types/slide"

import { SlideList } from "./SlideList"
import ActiveSlideEditor from "./ActiveSlideEditor"
import SlideToolbar from "./SlideToolbar"
import ActiveSlideView from "./ActiveSlideView"

import { slideThemes, getThemeByName } from "@/lib/slideThemes"

export default function SlideWorkspace({
  deck,
  deckId,
  deckVersion,
  onSaved,
}: {
  deck: SlideDeck | null
  deckId: string
  deckVersion: string | number
  onSaved?: () => void
}) {
  const [localDeck, setLocalDeck] = useState<SlideDeck | null>(null)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTheme, setActiveTheme] = useState(slideThemes[0])

  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ✅ UNDO state
  const [historyLen, setHistoryLen] = useState<number>(0)
  const [isUndoing, setIsUndoing] = useState(false)

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingPptx, setIsExportingPptx] = useState(false)


  async function refreshHistoryLen() {
    if (!deckId) return
    try {
      const res = await fetch(`/api/documents/${deckId}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const n = typeof data?.historyLen === "number" ? data.historyLen : 0
      setHistoryLen(n)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!deck) {
      setLocalDeck(null)
      setActiveId(null)
      setIsDirty(false)
      setHistoryLen(0)
      return
    }

    const slides: Slide[] = Array.isArray(deck.slides) ? deck.slides : []

    setLocalDeck({
      ...deck,
      slides: slides.map((s) => ({ ...s })),
    })

    setActiveId(slides[0]?.id ?? null)
    setActiveTheme(getThemeByName(deck.themeName))
    setIsDirty(false)

    // ✅ deck değişince historyLen çek
    refreshHistoryLen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, deckVersion])

  useEffect(() => {
    if (!localDeck || !isDirty || !deckId) return

    if (saveTimeout.current) clearTimeout(saveTimeout.current)

    saveTimeout.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        await saveDeck()
        setIsDirty(false)
      } finally {
        setIsSaving(false)
      }
    }, 700)

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [localDeck, isDirty, deckId])

  if (!localDeck) {
    return <div className="m-auto text-zinc-500">Sunum yükleniyor…</div>
  }

  if (!Array.isArray(localDeck.slides) || localDeck.slides.length === 0) {
    return (
      <div className="flex h-full w-full flex-col bg-zinc-900">
        <div className="flex flex-1 items-center justify-center text-zinc-300">
          Henüz slayt yok. Soldaki sohbetten sunum oluştur.
        </div>
      </div>
    )
  }

  const activeSlide = (() => {
    const found = localDeck.slides.find((s) => s.id === activeId)
    return found ?? localDeck.slides[0] ?? null
  })()

  function updateSlide(updated: Slide) {
    setLocalDeck((prev) =>
      prev
        ? {
            ...prev,
            slides: prev.slides.map((s) => (s.id === updated.id ? { ...updated } : s)),
          }
        : prev
    )
    setIsDirty(true)
  }

  function addSlide() {
    const newId = crypto.randomUUID()

    const slide: Slide = {
      id: newId,
      title: "Yeni Slide",
      bullets: ["Yeni madde"],
      imagePrompt: "",
    }

    setLocalDeck((prev) => (prev ? { ...prev, slides: [...prev.slides, slide] } : prev))
    setActiveId(slide.id)
    setIsDirty(true)
  }

  function deleteSlide() {
    setLocalDeck((prev) => {
      if (!prev || prev.slides.length === 1) return prev
      const slides = prev.slides.filter((s) => s.id !== activeId)
      setActiveId(slides[0]?.id ?? null)
      return { ...prev, slides }
    })
    setIsDirty(true)
  }

  function moveSlide(dir: "up" | "down") {
    setLocalDeck((prev) => {
      if (!prev) return prev
      const i = prev.slides.findIndex((s) => s.id === activeId)
      const j = dir === "up" ? i - 1 : i + 1
      if (i < 0 || j < 0 || j >= prev.slides.length) return prev
      const slides = [...prev.slides]
      ;[slides[i], slides[j]] = [slides[j], slides[i]]
      return { ...prev, slides }
    })
    setIsDirty(true)
  }

  async function saveDeck() {
    if (!localDeck || !deckId) return
    const res = await fetch(`/api/documents/${deckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: localDeck.title,
        slides: localDeck.slides,
        themeName: localDeck.themeName,
      }),
    })
    // PATCH sonrası history büyümüş olabilir
    if (res.ok) {
      try {
        const data = await res.json()
        if (typeof data?.historyLen === "number") setHistoryLen(data.historyLen)
      } catch {}
    }
    onSaved?.()
  }

  async function regenerate(mode: "text" | "imagePrompt") {
    if (!activeSlide || !deckId) return

    const res = await fetch("/api/slides/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: deckId,
        slideId: activeSlide.id,
        mode,
      }),
    })
    if (!res.ok) return

    const data = await res.json()
    updateSlide(data.slide)
    refreshHistoryLen()
  }

  async function undo() {
    if (!deckId) return
    if (historyLen <= 0) return

    setIsUndoing(true)
    try {
      const res = await fetch(`/api/documents/${deckId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undo" }),
      })
      if (!res.ok) return

      const data = await res.json()

      const nextDeck = data?.deck as SlideDeck | null
      if (nextDeck && Array.isArray(nextDeck.slides)) {
        setLocalDeck({
          ...nextDeck,
          slides: nextDeck.slides.map((s) => ({ ...s })),
        })
        const stillExists = nextDeck.slides.some((s) => s.id === activeId)
        setActiveId(stillExists ? activeId : nextDeck.slides[0]?.id ?? null)

        setActiveTheme(getThemeByName(nextDeck.themeName))
        setIsDirty(false)
      }

      if (typeof data?.historyLen === "number") {
        setHistoryLen(data.historyLen)
      } else {
        refreshHistoryLen()
      }
    } finally {
      setIsUndoing(false)
    }
  }

  async function exportPdf() {
    if (!deckId) return
    try {
      setIsExportingPdf(true)
      if (isDirty) await saveDeck()
      window.open(`/api/documents/${deckId}/export/pdf`, "_self")
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function exportPptx() {
    if (!deckId) return
    try {
      setIsExportingPptx(true)
      if (isDirty) await saveDeck()
      window.open(`/api/documents/${deckId}/export/pptx`, "_self")
    } finally {
      setIsExportingPptx(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-900">
      <SlideToolbar
        onAdd={addSlide}
        onDelete={deleteSlide}
        onMoveUp={() => moveSlide("up")}
        onMoveDown={() => moveSlide("down")}
        onSave={saveDeck}
        onRegenerateText={() => regenerate("text")}
        onRegenerateImage={() => regenerate("imagePrompt")}
        onExportPdf={exportPdf}
        onExportPptx={exportPptx}
        isExportingPdf={isExportingPdf}
        isExportingPptx={isExportingPptx}
        onUndo={undo}
        canUndo={historyLen > 0}
        isUndoing={isUndoing}
        isSaving={isSaving}
        isDirty={isDirty}
        deckId={deckId}
      />

      <div className="px-4 py-2 border-b border-zinc-800">
        <select
          className="bg-zinc-800 text-white px-3 py-1 rounded"
          value={activeTheme.name}
          onChange={(e) => {
            const theme = getThemeByName(e.target.value)
            setActiveTheme(theme)
            setLocalDeck((prev) => (prev ? { ...prev, themeName: theme.name } : prev))
            setIsDirty(true)
          }}
        >
          {slideThemes.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <SlideList
          slides={localDeck.slides}
          activeId={activeId ?? localDeck.slides[0]?.id ?? ""}
          themeName={localDeck.themeName}
          onSelect={setActiveId}
          onReorder={(slides) => {
            setLocalDeck((prev) => (prev ? { ...prev, slides } : prev))
            setIsDirty(true)
          }}
        />

        <div className="flex flex-1 flex-col items-center overflow-auto bg-zinc-800">
          <div className="my-10 aspect-video w-full max-w-5xl rounded-xl bg-white shadow-2xl">
            {activeSlide ? (
              <ActiveSlideView slide={activeSlide} theme={activeTheme} onChange={updateSlide} />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400">
                Slide seçilmedi
              </div>
            )}
          </div>

          <div className="w-full max-w-5xl px-6 pb-10">
            {activeSlide ? <ActiveSlideEditor slide={activeSlide} onChange={updateSlide} /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
