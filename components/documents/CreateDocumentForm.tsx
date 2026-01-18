"use client";

import { useState } from "react";

export default function CreateDocumentForm() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 1️⃣ boş document oluştur
    const res = await fetch("/api/documents", {
      method: "POST",
      body: JSON.stringify({
        title: topic,
        topic,
      }),
    });

    const doc = await res.json();

    // 2️⃣ AI generate
    await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        documentId: doc.id,
        topic,
      }),
    });

    setLoading(false);
    setTopic("");
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
        className="w-full rounded bg-white text-black py-2 hover:bg-zinc-200"
        disabled={loading}
      >
        {loading ? "Slide oluşturuluyor..." : "Generate Slides"}
      </button>
    </form>
  );
}
