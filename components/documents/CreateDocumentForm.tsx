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
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError(null)

    try {
      /* ---------------------------------
         1️⃣ BOŞ DOCUMENT OLUŞTUR
      --------------------------------- */
      const docRes = await fetch("/api/documents/create", {
        method: "POST",
      })

      if (!docRes.ok) {
        throw new Error("Document oluşturulamadı")
      }

      const document = await docRes.json()

      /* ---------------------------------
         2️⃣ AI SLIDE GENERATE
      --------------------------------- */
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      })

      if (!genRes.ok) {
        throw new Error("AI slide üretimi başarısız")
      }

      const deck: SlideDeck = await genRes.json()

      // frontend state için id eşitle
      deck.id = document.id

      /* ---------------------------------
         3️⃣ ASIL KAYIT (PATCH)
      --------------------------------- */
      const patchRes = await fetch(
        `/api/documents/${document.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: deck.title ?? topic,
            content: deck.slides, // 🔥 JSON, stringify YOK
            themeName: deck.themeName ?? "dark",
          }),
        }
      )

      if (!patchRes.ok) {
        throw new Error("Document update başarısız")
      }

      /* ---------------------------------
         4️⃣ UI'YA DECK'İ VER
      --------------------------------- */
      onGenerated(deck)
      setTopic("")
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? "Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        className="w-full rounded border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 h-28"
        placeholder="Sunum konusu yaz (örn: Yapay Zeka ve Gelecek)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        disabled={loading}
        required
      />

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded bg-white text-black py-2 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Slide oluşturuluyor..." : "Generate Slides"}
      </button>
    </form>
  )
}
