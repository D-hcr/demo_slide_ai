"use client"

import { useState } from "react"
import type { SlideDeck } from "@/types/slide"

import CreateDocumentForm from "@/components/documents/CreateDocumentForm"
import SlideWorkspace from "@/components/slides/SlideWorkspace"
import AuthStatus from "@/components/auth/auth-status"

export default function HomeClient({ session }: { session: any }) {
  const [deck, setDeck] = useState<SlideDeck | null>(null)

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* SOL PANEL */}
      <div className="flex w-full md:w-1/2 flex-col border-r border-zinc-800 p-6">
        <h1 className="text-2xl font-bold mb-2">Slide AI</h1>
        <p className="text-sm text-zinc-400 mb-6">
          AI destekli sunum oluşturucu
        </p>

        <AuthStatus />

        {session && (
          <div className="mt-6">
            <CreateDocumentForm onGenerated={setDeck} />
          </div>
        )}
      </div>

      {/* SAĞ PANEL */}
      <div className="hidden md:flex w-1/2 bg-zinc-900 p-6">
        {session ? (
          <SlideWorkspace deck={deck} />
        ) : (
          <div className="m-auto text-zinc-500">
            Slide oluşturmak için giriş yap
          </div>
        )}
      </div>
    </div>
  )
}
