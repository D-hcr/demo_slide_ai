"use client";

import { useEffect, useMemo, useState } from "react";
import type { SlideDeck } from "@/types/slide";

import ChatWorkspace from "@/components/chat/ChatWorkspace";
import SlideWorkspace from "@/components/slides/SlideWorkspace";
import Sidebar from "@/components/sidebar/Sidebar";
import LoginScreen from "@/components/auth/LoginScreen";

type SlideDeckResponse = {
  id?: string;
  title?: string;
  slides?: any[];
  content?: any[];
  themeName?: string;
  updatedAt?: string;
};

type Presentation = {
  id: string;
  title: string;
  updatedAt: string;
};

function normalizeDeck(raw: SlideDeckResponse): SlideDeck | null {
  const id = raw.id;
  if (!id) return null;

  return {
    id,
    title: raw.title ?? "Yeni Sunum",
    slides: (raw.slides ?? raw.content ?? []) as any[],
    themeName: raw.themeName ?? "Default",
  };
}

export default function HomeClient({ session }: { session: any }) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [deckId, setDeckId] = useState<string | null>(null);
  const [deck, setDeck] = useState<SlideDeck | null>(null);

  // ✅ chat update ile SlideWorkspace re-init tetiklemek için
  const [deckVersion, setDeckVersion] = useState<number>(0);

  const [loading, setLoading] = useState(true);

  // ✅ SADECE gerçekten slayt varsa sağ panel açılır
  const hasActiveDeck = useMemo(() => {
    return (
      !!deckId &&
      !!deck &&
      Array.isArray(deck.slides) &&
      deck.slides.length > 0
    );
  }, [deck, deckId]);

  async function refreshPresentations() {
    const res = await fetch("/api/documents", { cache: "no-store" });
    if (!res.ok) return;
    const docs = (await res.json()) as Presentation[];
    setPresentations(docs);
  }

  async function loadDeckById(id: string) {
    const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
    if (!res.ok) return;

    const raw: SlideDeckResponse = await res.json();
    const fixed = normalizeDeck(raw);
    if (!fixed) return;

    setDeck(fixed);
    setDeckId(fixed.id);
    setDeckVersion((v) => v + 1);
  }

  async function loadLatestDeck() {
    const res = await fetch("/api/documents/latest", { cache: "no-store" });
    if (!res.ok) return;

    const raw: SlideDeckResponse | null = await res.json();
    if (!raw) return;

    const fixed = normalizeDeck(raw);
    if (!fixed) return;

    setDeck(fixed);
    setDeckId(fixed.id);
    setDeckVersion((v) => v + 1);
  }

  async function handleNewPresentation() {
    const res = await fetch("/api/documents", { method: "POST" });
    if (!res.ok) return;

    const raw: SlideDeckResponse = await res.json();
    const fixed = normalizeDeck(raw);
    if (!fixed) return;

    await refreshPresentations();

    // ✅ deckId set edilir ama slides boş => hasActiveDeck false => sağ panel hiç mount olmaz
    setDeckId(fixed.id);
    setDeck({
      ...fixed,
      slides: [],
      title: fixed.title ?? "Yeni Sunum",
    });
    setDeckVersion((v) => v + 1);
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/documents/${id}/duplicate`, {
      method: "POST",
    });
    if (!res.ok) return;

    const created = (await res.json()) as { id: string };
    await refreshPresentations();
    if (created?.id) {
      await loadDeckById(created.id);
    }
  }

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await refreshPresentations();
        await loadLatestDeck();
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  if (!session) {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-100 flex">
        <LoginScreen />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        Sunum yükleniyor...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar
        user={session.user}
        presentations={presentations}
        activeId={deckId ?? ""}
        onSelect={(id) => {
          if (id === deckId) return;
          loadDeckById(id);
        }}
        onNew={handleNewPresentation}
        onDuplicate={handleDuplicate}
        onRename={async (id, nextTitle) => {
          const res = await fetch(`/api/documents/${id}/meta`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: nextTitle }),
          });
          if (!res.ok) return;

          if (deckId === id && deck) {
            setDeck({ ...deck, title: nextTitle });
            setDeckVersion((v) => v + 1);
          }
          await refreshPresentations();
        }}
        onDelete={async (id) => {
          const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
          if (!res.ok) return;

          if (deckId === id) {
            setDeck(null);
            setDeckId(null);
            setDeckVersion((v) => v + 1);
            await refreshPresentations();
            await loadLatestDeck();
          } else {
            await refreshPresentations();
          }
        }}
      />

      <main className="flex flex-1 overflow-hidden">
        <div className="flex w-full h-full">
          <ChatWorkspace
            centered={!hasActiveDeck}
            deckId={deckId}
            onGeneratedOrUpdated={async (raw: SlideDeckResponse | null) => {
              if (!raw) return;

              const fixed = normalizeDeck(raw as any);
              if (!fixed) return;

              setDeck(fixed);
              setDeckId(fixed.id);
              setDeckVersion((v) => v + 1);
              await refreshPresentations();
            }}
          />

          {/* ✅ Sağ panel sadece slayt varsa mount olur (new presentation'da hiç görünmez) */}
          {hasActiveDeck && deck && deckId ? (
            <div className="flex-1 opacity-100 transition-all duration-700 ease-in-out overflow-hidden">
              <SlideWorkspace
                deck={deck}
                deckId={deckId}
                deckVersion={deckVersion}
                onSaved={refreshPresentations as any}
              />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
