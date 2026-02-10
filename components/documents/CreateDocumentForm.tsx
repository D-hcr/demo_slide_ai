// components/documents/CreateDocumentForm.tsx
"use client"

import { useState } from "react"
import type { SlideDeck } from "@/types/slide"

export default function CreateDocumentForm({
  onGenerated,
}: {
  onGenerated: (deck: SlideDeck) => void
}) {
  const [topic, setTopic] = useState("")
  const [audience, setAudience] = useState("General")
  const [tone, setTone] = useState("Professional")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, tone }),
      })

      if (!res.ok) throw new Error("Slide oluşturulamadı")

      const deck: SlideDeck = await res.json()
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="text-sm text-zinc-400">Topic</label>
        <textarea
          className="w-full rounded border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 h-24"
          placeholder="Sunum konusu (örn: Yapay Zeka ve Gelecek)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div>
        <label className="text-sm text-zinc-400">Audience</label>
        <select
          className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-zinc-100"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          disabled={loading}
        >
          <option>General</option>
          <option>Executives</option>
          <option>Technical</option>
          <option>Students</option>
          <option>Customers</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-zinc-400">Tone</label>
        <select
          className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-zinc-100"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          disabled={loading}
        >
          <option>Professional</option>
          <option>Formal</option>
          <option>Friendly</option>
          <option>Persuasive</option>
          <option>Minimal</option>
        </select>
      </div>

      {error ? <div className="text-red-500 text-sm">{error}</div> : null}

      <button
        type="submit"
        className="w-full rounded bg-white text-black py-2 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "AI oluşturuyor..." : "Generate Slides"}
      </button>
    </form>
  )
}
