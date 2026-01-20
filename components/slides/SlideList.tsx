"use client"

import type { Slide } from "@/types/slide"

interface Props {
  slides: Slide[]
  activeId: number
  onSelect: (id: number) => void
}

export function SlideList({ slides, activeId, onSelect }: Props) {
  return (
    <div className="w-56 border-r border-zinc-800 bg-zinc-950">
      {slides.map((slide) => (
        <button
          key={slide.id}
          onClick={() => onSelect(slide.id)}
          className={`w-full text-left px-4 py-3 text-sm border-b border-zinc-800
            ${
              slide.id === activeId
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900"
            }`}
        >
          {slide.title}
        </button>
      ))}
    </div>
  )
}
