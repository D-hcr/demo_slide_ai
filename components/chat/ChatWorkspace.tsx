"use client";

import { useEffect, useRef, useState } from "react";
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

  // ✅ callback ref (deps yüzünden effect loop olmasın)
  const onGeneratedRef = useRef(onGeneratedOrUpdated);
  useEffect(() => {
    onGeneratedRef.current = onGeneratedOrUpdated;
  }, [onGeneratedOrUpdated]);

  // ✅ yalnızca "başarılı yükleme" sonrası işaretle
  const lastLoadedChatDeckIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (!deckId) {
      lastLoadedChatDeckIdRef.current = null;
      setMessages([]);
      setLoading(false);
      return () => {
        controller.abort();
      };
    }

    // ✅ aynı deckId başarılı yüklendiyse tekrar fetch atma
    if (lastLoadedChatDeckIdRef.current === deckId) return;

    // deck değişti, UI boş kalmasın diye mevcut mesajları temizle
    setMessages([]);
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/documents/${deckId}/chat`, {
          cache: "no-store",
          signal: controller.signal,
        });

        // ❗ başarısızsa ref set ETME → sonraki render’da tekrar deneyebilsin
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

        // ✅ başarılı yükleme → şimdi ref'i set et
        lastLoadedChatDeckIdRef.current = deckId;

        // ✅ deck bilgisi de gelsin
        onGeneratedRef.current(data?.deck ?? null);
      } catch {
        // ignore (abort vs)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
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

      // POST sonrası deck güncellendi
      onGeneratedRef.current(data?.deck ?? null);

      // ✅ bu deck için chat zaten yüklü sayılır
      lastLoadedChatDeckIdRef.current = deckId;
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
