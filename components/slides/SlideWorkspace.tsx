"use client"

import { useEffect, useState } from "react"
import type { SlideDeck, Slide } from "@/types/slide"

import { SlideList } from "./SlideList"
import ActiveSlideEditor from "./ActiveSlideEditor"
import SlideToolbar from "./SlideToolbar"

export default function SlideWorkspace({
  deck,
}: {
  deck: SlideDeck | null
}) {
  const [localDeck, setLocalDeck] = useState<SlideDeck | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)

  // 🔑 DECK GELDİĞİNDE STATE'İ KUR
  useEffect(() => {
  if (!deck) return

  const clonedDeck: SlideDeck = {
    ...deck,
    slides: deck.slides.map((s) => ({ ...s })),
  }

  setLocalDeck(clonedDeck)
  setActiveId(clonedDeck.slides[0]?.id ?? null)
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

  return (
    <div className="flex w-full h-full flex-col">
      <SlideToolbar
        onAdd={addSlide}
        onDelete={deleteSlide}
        onMoveUp={() => moveSlide("up")}
        onMoveDown={() => moveSlide("down")}
      />

      <div className="flex flex-1">
        <SlideList
          slides={localDeck.slides}
          activeId={activeId}
          onSelect={setActiveId}
        />

        <ActiveSlideEditor
          slide={activeSlide}
          onChange={updateSlide}
        />
      </div>
    </div>
  )
}
