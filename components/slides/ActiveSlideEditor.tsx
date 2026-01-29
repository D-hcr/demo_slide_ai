"use client"

import { useState } from "react"
import type { Slide } from "@/types/slide"
import BulletEditor from "./BulletEditor"

interface Props {
  slide: Slide
  onChange: (updated: Slide) => void
}

export default function ActiveSlideEditor({ slide, onChange }: Props) {
  const [loadingText, setLoadingText] = useState(false)
  const [loadingPrompt, setLoadingPrompt] = useState(false)

  async function regenerateText() {
    try {
      setLoadingText(true)
      const res = await fetch("/api/slides/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "text", slide }),
      })
      if (!res.ok) throw new Error("Regenerate text failed")

      const data = await res.json()
      onChange({
        ...slide,
        title: typeof data.title === "string" ? data.title : slide.title,
        bullets: Array.isArray(data.bullets) ? data.bullets : slide.bullets,
        notes: typeof data.notes === "string" ? data.notes : slide.notes,
      })
    } finally {
      setLoadingText(false)
    }
  }

  async function regenerateImagePrompt() {
    try {
      setLoadingPrompt(true)
      const res = await fetch("/api/slides/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "imagePrompt", slide }),
      })
      if (!res.ok) throw new Error("Regenerate image prompt failed")

      const data = await res.json()
      const nextPrompt = typeof data.imagePrompt === "string" ? data.imagePrompt : slide.imagePrompt

      // prompt değişince görseli de resetleyelim ki yeni görsel gelsin
      onChange({
        ...slide,
        imagePrompt: nextPrompt,
        imageUrl: undefined,
      })
    } finally {
      setLoadingPrompt(false)
    }
  }

  function regenerateImageOnly() {
    // sadece görseli yeniden üret: imageUrl reset
    onChange({ ...slide, imageUrl: undefined })
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* TITLE + REGENERATE */}
      <div className="flex items-center gap-2">
        <input
          className="w-full text-2xl font-bold bg-transparent border-b border-zinc-700 focus:outline-none"
          value={slide.title}
          onChange={(e) => onChange({ ...slide, title: e.target.value })}
          placeholder="Slide başlığı"
        />

        <button
          onClick={regenerateText}
          disabled={loadingText}
          className="rounded bg-zinc-800 px-3 py-2 text-sm text-white disabled:opacity-50"
          title="Başlık + maddeleri AI ile yenile"
        >
          {loadingText ? "AI..." : "AI Yenile"}
        </button>
      </div>

      {/* LAYOUT */}
      <div className="flex items-center gap-3">
        <div className="text-sm text-zinc-300">Layout</div>
        <select
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
          value={slide.layout ?? "text-left"}
          onChange={(e) => onChange({ ...slide, layout: e.target.value as any })}
        >
          <option value="text-left">text-left</option>
          <option value="image-left">image-left</option>
          <option value="full-image">full-image</option>
        </select>
      </div>

      {/* BULLETS */}
      <BulletEditor
        bullets={slide.bullets}
        onChange={(bullets) => onChange({ ...slide, bullets })}
      />

      {/* IMAGE PROMPT + REGENERATE */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm text-zinc-300">Image prompt</div>

          <button
            onClick={regenerateImagePrompt}
            disabled={loadingPrompt}
            className="rounded bg-zinc-800 px-3 py-1 text-xs text-white disabled:opacity-50"
            title="Image prompt'u AI ile yenile (ve görseli sıfırla)"
          >
            {loadingPrompt ? "AI..." : "AI Prompt"}
          </button>

          <button
            onClick={regenerateImageOnly}
            className="rounded bg-zinc-800 px-3 py-1 text-xs text-white"
            title="Aynı prompt ile görseli yeniden üret"
          >
            Görseli Yenile
          </button>
        </div>

        <textarea
          className="w-full min-h-[90px] bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
          value={slide.imagePrompt ?? ""}
          onChange={(e) => onChange({ ...slide, imagePrompt: e.target.value })}
          placeholder="Görsel için prompt…"
        />
      </div>
    </div>
  )
}
