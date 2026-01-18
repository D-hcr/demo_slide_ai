"use client"

import { useState } from "react"
import type { SlideDeck } from "@/types/slide"
import { SlideDeckView } from "@/components/slides"

export default function SlideWorkspace() {
  const [deck, setDeck] = useState<SlideDeck | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate(topic: string) {
    setLoading(true)

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    })

    const data = await res.json()

    // Eğer API string JSON dönüyorsa:
    const parsed =
      typeof data.slides === "string"
        ? JSON.parse(data.slides)
        : data

    setDeck(parsed)
    setLoading(false)
  }

  return (
    <div className="h-full w-full flex flex-col">
      <button
        onClick={() => generate("Yapay Zeka Nedir")}
        className="mb-4 px-4 py-2 bg-white text-black rounded self-start"
      >
        {loading ? "Oluşturuluyor..." : "Sunum Oluştur"}
      </button>

      <div className="flex-1 overflow-auto">
        {deck ? (
          <SlideDeckView deck={deck} />
        ) : (
          <div className="text-zinc-500 text-center mt-20">
            Henüz slide oluşturulmadı
          </div>
        )}
      </div>
    </div>
  )
}
