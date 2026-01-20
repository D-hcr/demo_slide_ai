"use client"

import { useState } from "react"
import type { SlideDeck } from "@/types/slide"

export default function CreateDocumentForm({
  onGenerated,
}: {
  onGenerated: (deck: SlideDeck) => void
}) {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    })

    const deck: SlideDeck = await res.json()

    onGenerated(deck)

    setTopic("")
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        className="w-full rounded border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 h-28"
        placeholder="Sunum konusu yaz (örn: Yapay Zeka ve Gelecek)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        required
      />

      <button
        className="w-full rounded bg-white text-black py-2"
        disabled={loading}
      >
        {loading ? "Slide oluşturuluyor..." : "Generate Slides"}
      </button>
    </form>
  )
}
