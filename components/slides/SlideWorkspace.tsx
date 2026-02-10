// /home/hacer/Desktop/slied_project/slide-ai/components/slides/SlideWorkspace.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import type { SlideDeck, Slide, DeckMeta } from "@/types/slide"

import { SlideList } from "./SlideList"
import ActiveSlideEditor from "./ActiveSlideEditor"
import SlideToolbar from "./SlideToolbar"
import ActiveSlideView from "./ActiveSlideView"

import { slideThemes, getThemeByName } from "@/lib/slideThemes"

function normalizeMeta(meta: any): DeckMeta {
  const topic = typeof meta?.topic === "string" ? meta.topic : ""
  const audience = typeof meta?.audience === "string" ? meta.audience : ""
  const tone = typeof meta?.tone === "string" ? meta.tone : ""
  return { topic, audience, tone }
}

function safeFilename(name: string) {
  const base = (name || "sunum").trim()
  const cleaned = base.replace(/[\/\\:*?"<>|]+/g, "-")
  return cleaned.slice(0, 120) || "sunum"
}

async function downloadFile(args: {
  url: string
  filename: string
  mimeFallback?: string
}) {
  const res = await fetch(args.url, { method: "GET", cache: "no-store" })

  // API bazen JSON error döndürüyor olabilir
  if (!res.ok) {
    const ct = res.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      const j = await res.json().catch(() => null)
      console.error("Export error:", j)
      throw new Error(j?.error || "Export failed")
    }
    const txt = await res.text().catch(() => "")
    console.error("Export error:", txt)
    throw new Error("Export failed")
  }

  const blob = await res.blob()
  const mime = blob.type || args.mimeFallback || "application/octet-stream"
  const finalBlob = blob.type ? blob : new Blob([blob], { type: mime })

  const href = URL.createObjectURL(finalBlob)
  try {
    const a = document.createElement("a")
    a.href = href
    a.download = args.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(href)
  }
}

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

  // ✅ UNDO/REDO
  const isRestoringRef = useRef(false)
  const [pastLen, setPastLen] = useState<number>(0)
  const [futureLen, setFutureLen] = useState<number>(0)
  const [isUndoing, setIsUndoing] = useState(false)
  const [isRedoing, setIsRedoing] = useState(false)

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingPptx, setIsExportingPptx] = useState(false)

  async function refreshStacks() {
    if (!deckId) return
    try {
      const res = await fetch(`/api/documents/${deckId}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setPastLen(typeof data?.pastLen === "number" ? data.pastLen : 0)
      setFutureLen(typeof data?.futureLen === "number" ? data.futureLen : 0)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!deck) {
      setLocalDeck(null)
      setActiveId(null)
      setIsDirty(false)
      setPastLen(0)
      setFutureLen(0)
      return
    }

    const slides: Slide[] = Array.isArray(deck.slides) ? deck.slides : []

    setLocalDeck({
      ...deck,
      meta: normalizeMeta(deck.meta),
      slides: slides.map((s) => ({ ...s })),
    })

    setActiveId(slides[0]?.id ?? null)
    setActiveTheme(getThemeByName(deck.themeName))
    setIsDirty(false)

    refreshStacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, deckVersion])

  useEffect(() => {
    if (!localDeck || !isDirty || !deckId || isRestoringRef.current) return

    if (saveTimeout.current) clearTimeout(saveTimeout.current)

    saveTimeout.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        const ok = await saveDeck()
        if (ok) setIsDirty(false)
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

  function updateSlide(updated: Slide, opts?: { silent?: boolean }) {
    setLocalDeck((prev) =>
      prev ? { ...prev, slides: prev.slides.map((s) => (s.id === updated.id ? { ...updated } : s)) } : prev
    )
    if (!opts?.silent) setIsDirty(true)
  }

  function updateMeta(patch: Partial<DeckMeta>) {
    setLocalDeck((prev) =>
      prev
        ? {
            ...prev,
            meta: {
              ...(prev.meta ?? {}),
              ...patch,
            },
          }
        : prev
    )
    setIsDirty(true)
  }

  function addSlide() {
    const id = crypto.randomUUID()
    const slide: Slide = { id, title: "Yeni Slide", bullets: ["Yeni madde"], imagePrompt: "" }

    setLocalDeck((prev) => (prev ? { ...prev, slides: [...prev.slides, slide] } : prev))
    setActiveId(id)
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

  async function saveDeck(): Promise<boolean> {
    if (!localDeck || !deckId) return false

    const res = await fetch(`/api/documents/${deckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: localDeck.title,
        slides: localDeck.slides,
        themeName: localDeck.themeName,
        meta: localDeck.meta ?? {},
      }),
    })

    if (!res.ok) return false

    try {
      const data = await res.json()
      setPastLen(typeof data?.pastLen === "number" ? data.pastLen : pastLen)
      setFutureLen(typeof data?.futureLen === "number" ? data.futureLen : futureLen)
    } catch {
      // ignore
    }

    onSaved?.()
    return true
  }

  async function regenerate(mode: "text" | "imagePrompt") {
    if (!activeSlide || !deckId) return

    const res = await fetch("/api/slides/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: deckId, slideId: activeSlide.id, mode }),
    })
    if (!res.ok) return

    const data = await res.json()
    updateSlide(data.slide, { silent: true })
    await refreshStacks()
  }

  async function undo() {
    if (!deckId || pastLen <= 0 || isUndoing) return

    setIsUndoing(true)
    isRestoringRef.current = true
    try {
      const res = await fetch(`/api/documents/${deckId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undo" }),
      })
      if (!res.ok) return
      const data = await res.json()

      const nextDeck = data?.deck as SlideDeck | null
      if (nextDeck?.slides?.length) {
        setLocalDeck({
          ...nextDeck,
          meta: normalizeMeta(nextDeck.meta),
          slides: nextDeck.slides.map((s) => ({ ...s })),
        })
        const stillExists = nextDeck.slides.some((s) => s.id === activeId)
        setActiveId(stillExists ? activeId : nextDeck.slides[0]?.id ?? null)
        setActiveTheme(getThemeByName(nextDeck.themeName))
        setIsDirty(false)
      }

      setPastLen(typeof data?.pastLen === "number" ? data.pastLen : 0)
      setFutureLen(typeof data?.futureLen === "number" ? data.futureLen : 0)
    } finally {
      isRestoringRef.current = false
      setIsUndoing(false)
    }
  }

  async function redo() {
    if (!deckId || futureLen <= 0 || isRedoing) return

    setIsRedoing(true)
    isRestoringRef.current = true
    try {
      const res = await fetch(`/api/documents/${deckId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redo" }),
      })
      if (!res.ok) return
      const data = await res.json()

      const nextDeck = data?.deck as SlideDeck | null
      if (nextDeck?.slides?.length) {
        setLocalDeck({
          ...nextDeck,
          meta: normalizeMeta(nextDeck.meta),
          slides: nextDeck.slides.map((s) => ({ ...s })),
        })
        const stillExists = nextDeck.slides.some((s) => s.id === activeId)
        setActiveId(stillExists ? activeId : nextDeck.slides[0]?.id ?? null)
        setActiveTheme(getThemeByName(nextDeck.themeName))
        setIsDirty(false)
      }

      setPastLen(typeof data?.pastLen === "number" ? data.pastLen : 0)
      setFutureLen(typeof data?.futureLen === "number" ? data.futureLen : 0)
    } finally {
      isRestoringRef.current = false
      setIsRedoing(false)
    }
  }

  async function exportPdf() {
    if (!deckId || !localDeck) return
    try {
      setIsExportingPdf(true)

      if (isDirty) {
        await saveDeck()
        await refreshStacks()
      }

      const filename = `${safeFilename(localDeck.title)}.pdf`
      await downloadFile({
        url: `/api/documents/${deckId}/export/pdf`,
        filename,
        mimeFallback: "application/pdf",
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsExportingPdf(false)
    }
  }


  async function exportPptx() {
    if (!deckId || !localDeck) return
    try {
      setIsExportingPptx(true)
      if (isDirty) {
        await saveDeck()
        await refreshStacks()
      }

      const filename = `${safeFilename(localDeck.title)}.pptx`
      await downloadFile({
        url: `/api/documents/${deckId}/export/pptx`,
        filename,
        mimeFallback:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsExportingPptx(false)
    }
  }

  const meta = localDeck.meta ?? {}

  return (
    <div className="flex h-full w-full flex-col bg-zinc-900">
      <SlideToolbar
        onAdd={addSlide}
        onDelete={deleteSlide}
        onMoveUp={() => moveSlide("up")}
        onMoveDown={() => moveSlide("down")}
        onSave={() => void saveDeck()}
        onRegenerateText={() => regenerate("text")}
        onRegenerateImage={() => regenerate("imagePrompt")}
        onExportPdf={exportPdf}
        onExportPptx={exportPptx}
        isExportingPdf={isExportingPdf}
        isExportingPptx={isExportingPptx}
        onUndo={undo}
        onRedo={redo}
        canUndo={pastLen > 0}
        canRedo={futureLen > 0}
        isUndoing={isUndoing}
        isRedoing={isRedoing}
        isSaving={isSaving}
        isDirty={isDirty}
        deckId={deckId}
      />

      {/* ✅ META + THEME BAR */}
      <div className="px-4 py-3 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-400 w-14">Theme</div>
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

        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] text-zinc-400 mb-1">Topic</div>
            <input
              value={meta.topic ?? ""}
              onChange={(e) => updateMeta({ topic: e.target.value })}
              className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-white border border-zinc-700 focus:outline-none focus:border-zinc-500"
              placeholder="Örn: Yapay zeka ile eğitim"
            />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 mb-1">Audience</div>
            <input
              value={meta.audience ?? ""}
              onChange={(e) => updateMeta({ audience: e.target.value })}
              className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-white border border-zinc-700 focus:outline-none focus:border-zinc-500"
              placeholder="Örn: Üniversite öğrencileri"
            />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 mb-1">Tone</div>
            <input
              value={meta.tone ?? ""}
              onChange={(e) => updateMeta({ tone: e.target.value })}
              className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-white border border-zinc-700 focus:outline-none focus:border-zinc-500"
              placeholder="Örn: Kurumsal, net, ikna edici"
            />
          </div>
        </div>
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
              <div className="flex h-full items-center justify-center text-zinc-400">Slide seçilmedi</div>
            )}
          </div>

          <div className="w-full max-w-5xl px-6 pb-10">
            {activeSlide ? (
              <ActiveSlideEditor slide={activeSlide} documentId={deckId} onChange={updateSlide} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
