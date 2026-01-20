"use client"

import type { Slide } from "@/types/slide"
import BulletEditor from "./BulletEditor"

interface Props {
  slide: Slide
  onChange: (updated: Slide) => void
}

export default function ActiveSlideEditor({
  slide,
  onChange,
}: Props) {
  return (
    <div className="flex-1 p-6 space-y-6">
      {/* TITLE */}
      <input
        className="w-full text-2xl font-bold bg-transparent border-b border-zinc-700 focus:outline-none"
        value={slide.title}
        onChange={(e) =>
          onChange({ ...slide, title: e.target.value })
        }
        placeholder="Slide başlığı"
      />

      {/* BULLETS */}
      <BulletEditor
        bullets={slide.bullets}
        onChange={(bullets) =>
          onChange({ ...slide, bullets })
        }
      />
    </div>
  )
}
    