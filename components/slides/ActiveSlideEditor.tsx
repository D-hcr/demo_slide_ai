"use client"

import { useState } from "react"
import type { Slide } from "@/types/slide"
import BulletEditor from "./BulletEditor"

interface Props {
  slide: Slide
  documentId: string
  onChange: (updated: Slide) => void
}

export default function ActiveSlideEditor({ slide, documentId, onChange }: Props) {
  const [loadingText, setLoadingText] = useState(false)
  const [loadingPrompt, setLoadingPrompt] = useState(false)

  async function regenerateText() {
    if (!documentId) return
    try {
      setLoadingText(true)
      const res = await fetch("/api/slides/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, slideId: slide.id, mode: "text" }),
      })
      if (!res.ok) throw new Error("Regenerate text failed")
      const data = await res.json()

      // ✅ sadece gerekli alanları merge et
      if (data?.slide) {
        onChange({
          ...slide,
          title: data.slide.title ?? slide.title,
          bullets: Array.isArray(data.slide.bullets) ? data.slide.bullets : slide.bullets,
          notes: data.slide.notes ?? slide.notes,
        })
      }
    } finally {
      setLoadingText(false)
    }
  }

  async function regenerateImagePrompt() {
    if (!documentId) return
    try {
      setLoadingPrompt(true)
      const res = await fetch("/api/slides/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, slideId: slide.id, mode: "imagePrompt" }),
      })
      if (!res.ok) throw new Error("Regenerate image prompt failed")
      const data = await res.json()

      if (data?.slide?.imagePrompt) {
        // ✅ prompt değişince görseli resetlemek mantıklı
        onChange({ ...slide, imagePrompt: data.slide.imagePrompt, imageUrl: undefined })
      }
    } finally {
      setLoadingPrompt(false)
    }
  }

  function regenerateImageOnly() {
    // prompt yoksa “yenile” anlamsız; boşsa sadece url reset yine de sorun değil ama UX için guard
    if (!slide.imagePrompt?.trim()) return
    onChange({ ...slide, imageUrl: undefined })
  }

  const layoutValue = slide.layout ?? "text-left"
  const canRegenImage = !!slide.imagePrompt?.trim()

  return (
    <div className="flex-1 p-6 space-y-6">
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

      <div className="flex items-center gap-3">
        <div className="text-sm text-zinc-300">Layout</div>
        <select
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
          value={layoutValue}
          onChange={(e) => {
            const next = e.target.value as any
            // ✅ full-image seçildiyse ama prompt yoksa kullanıcıya “boş full” bırakmayalım:
            if (next === "full-image" && !slide.imagePrompt?.trim()) {
              onChange({ ...slide, layout: "text-left" })
              return
            }
            onChange({ ...slide, layout: next })
          }}
        >
          <option value="text-left">text-left</option>
          <option value="image-left">image-left</option>
          <option value="full-image">full-image</option>
        </select>
      </div>

      <BulletEditor bullets={slide.bullets} onChange={(bullets) => onChange({ ...slide, bullets })} />

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
            disabled={!canRegenImage}
            className="rounded bg-zinc-800 px-3 py-1 text-xs text-white disabled:opacity-40"
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
