"use client"

import type { Slide } from "@/types/slide"

export function ActiveSlideView({ slide }: { slide: Slide }) {
  return (
    <div className="flex-1 p-8">

      <h2 className="text-2xl font-bold mb-6">
        {slide.title}
      </h2>

      <ul className="list-disc pl-6 space-y-3 text-zinc-200">
        {slide.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>

      <div className="mt-8 text-sm text-zinc-400 border-t border-zinc-800 pt-4">
        <strong>Image Prompt:</strong>
        <p className="mt-1">{slide.imagePrompt}</p>
      </div>

      {slide.notes && (
        <div className="mt-4 text-sm text-zinc-400">
          <strong>Notes:</strong>
          <p>{slide.notes}</p>
        </div>
      )}
    </div>
  )
}
