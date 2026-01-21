"use client"

import { useEffect, useState } from "react"
import type { SlideDeck, Slide } from "@/types/slide"

import { SlideList } from "./SlideList"
import ActiveSlideEditor from "./ActiveSlideEditor"
import SlideToolbar from "./SlideToolbar"
import ActiveSlideView from "./ActiveSlideView"

import { slideThemes } from "@/lib/slideThemes"
import { getThemeByName } from "@/lib/slideThemes"


export default function SlideWorkspace({
  deck,
  deckId
}: {
  deck: SlideDeck | null
  deckId: string
}) {
  const [localDeck, setLocalDeck] = useState<SlideDeck | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [activeTheme, setActiveTheme] = useState(slideThemes[0])

  // 🔑 DECK GELDİĞİNDE STATE'İ KUR

  useEffect(() => {
  if (!deck) return

  const clonedDeck: SlideDeck = {
    ...deck,
    slides: deck.slides.map((s) => ({ ...s })),
  }

  setLocalDeck(clonedDeck)
  setActiveId(clonedDeck.slides[0]?.id ?? null)

  // ✅ theme restore
  setActiveTheme(getThemeByName(deck.themeName))
}, [deck])

  // 🔐 GÜVENLİ RENDER
  if (!localDeck || activeId === null) {
    return (
      <div className="m-auto text-zinc-500">
        Henüz slide oluşturulmadı
      </div>
    )
  }

  const activeSlide = localDeck.slides.find(
    (s) => s.id === activeId
  )!

  function updateSlide(updated: Slide) { 
    if (!localDeck) return 
    setLocalDeck({ 
      ...localDeck,
      slides: localDeck.slides.map((s) =>
        s.id === updated.id ? updated : s
      ),
    })
  }

  function addSlide() {
    if (!localDeck) return

    const newSlide: Slide = {
      id: Date.now(),
      title: "Yeni Slide",
      bullets: ["Yeni madde"],
      imagePrompt: "",
    }

    setLocalDeck({ 
      ...localDeck, 
      slides: [...localDeck.slides, newSlide], 
    })

    setActiveId(newSlide.id)
  }

  function deleteSlide() {
    if (!localDeck || localDeck.slides.length === 1) return

    const filtered = localDeck.slides.filter(
      (s) => s.id !== activeId
    )

    setLocalDeck({
      ...localDeck,
      slides: filtered,
    })

    setActiveId(filtered[0].id)
  }

  function moveSlide(dir: "up" | "down") {
    if (!localDeck) return

    const i = localDeck.slides.findIndex(
      (s) => s.id === activeId
    )

    const j = dir === "up" ? i - 1 : i + 1
    if (j < 0 || j >= localDeck.slides.length) return

    const reordered = [...localDeck.slides]
    ;[reordered[i], reordered[j]] = [
      reordered[j],
      reordered[i],
    ]

    setLocalDeck({
      ...localDeck,
      slides: reordered,
    })
  }

  async function saveDeck() {
  if (!localDeck) return

  await fetch(`/api/documents/${deckId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deck: localDeck,
    }),
  })
}


  return (
    <div className="flex w-full h-full flex-col">
      <SlideToolbar
        onAdd={addSlide}
        onDelete={deleteSlide}
        onMoveUp={() => moveSlide("up")}
        onMoveDown={() => moveSlide("down")}
        onSave={saveDeck}
      />

      {/* THEME SELECTOR (UI ONLY) */}
      <div className="px-4 py-2"> 
        <select
          className="bg-zinc-800 text-white px-3 py-1 rounded"
          value={activeTheme.name}
          onChange={(e) => {
            const theme = getThemeByName(e.target.value)
            setActiveTheme(theme)
            setLocalDeck({
            ...localDeck,
            themeName: theme.name,
          })
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
          activeId={activeId}
          onSelect={setActiveId}
        />

        <ActiveSlideEditor
          slide={activeSlide}
          onChange={updateSlide}
        />

        <ActiveSlideView
          slide={activeSlide}
          theme={activeTheme}
        /> 
      </div>
    </div>
  )
}