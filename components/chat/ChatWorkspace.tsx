"use client";

import { useEffect, useState } from "react";
import ChatMessage, { ChatRole } from "./ChatMessage";
import ChatInput from "./ChatInput";
import type { SlideDeckResponse } from "@/types/slide";

type Message = {
  role: ChatRole;
  content: string;
};

export default function ChatWorkspace({
  centered,
  deckId,
  onGeneratedOrUpdated,
}: {
  centered: boolean;
  deckId: string | null;
  onGeneratedOrUpdated: (deck: SlideDeckResponse | null) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ deck değişince o deck’in chat’ini yükle
  useEffect(() => {
    let cancelled = false;

    if (!deckId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/documents/${deckId}/chat`, { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        if (cancelled) return;

        const msgs = Array.isArray(data?.messages) ? data.messages : [];
        setMessages(
          msgs.map((m: any) => ({
            role: (m.role as ChatRole) ?? "assistant",
            content: String(m.content ?? ""),
          }))
        );

        // ✅ deck bilgisi de gelsin (sunumu güncelleyecek)
        onGeneratedOrUpdated(data?.deck ?? null);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deckId]);

  async function handleSend(text: string) {
    if (!deckId) return;

    setLoading(true);

    // optimistic
    setMessages((m) => [...m, { role: "user", content: text }]);
    setMessages((m) => [...m, { role: "system", content: "İşleniyor…" }]);

    try {
      const res = await fetch(`/api/documents/${deckId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();

      const msgs = Array.isArray(data?.messages) ? data.messages : [];
      setMessages(
        msgs.map((m: any) => ({
          role: (m.role as ChatRole) ?? "assistant",
          content: String(m.content ?? ""),
        }))
      );

      onGeneratedOrUpdated(data?.deck ?? null);
    } catch {
      setMessages((m) => m.filter((x) => x.role !== "system"));
      setMessages((m) => [...m, { role: "assistant", content: "Bir hata oluştu." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex flex-col ${
        centered ? "flex-1 items-center" : "w-[420px] border-r border-zinc-800"
      }`}
    >
      <div className={`flex-1 overflow-y-auto p-6 w-full ${centered ? "max-w-3xl mx-auto" : ""}`}>
        {messages.length === 0 && !loading && (
          <div className="text-zinc-500 text-center mt-24">
            {deckId
              ? "Sunum oluşturmak için konu yaz 👇 (örn: 'Güneş Sistemi hakkında 8 sayfalık sunum oluştur')"
              : "Önce yeni bir sunum oluştur 👈"}
          </div>
        )}

        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} content={m.content} />
        ))}
      </div>

      <ChatInput onSend={handleSend} disabled={loading || !deckId} />
    </div>
  );
}
