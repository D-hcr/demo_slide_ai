"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import { PresentationsProvider } from "./presentations-context"

type Presentation = {
  id: string
  title: string
  updatedAt: string
}

export default function ProtectedChrome({
  user,
  presentations: initialPresentations,
  children,
}: {
  user: any
  presentations: Presentation[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const [presentations, setPresentations] = useState<Presentation[]>(initialPresentations ?? [])

  // ✅ Server’dan yeni prop geldiyse state’i senkronla (örn router.refresh ile)
  useEffect(() => {
    setPresentations(initialPresentations ?? [])
  }, [initialPresentations])

  const activeId = useMemo(() => {
    return sp.get("doc") ?? ""
  }, [sp])

  async function refreshPresentations() {
    const res = await fetch("/api/documents", { cache: "no-store" })
    if (!res.ok) return
    const docs = (await res.json()) as Presentation[]
    setPresentations(docs)
  }

  async function goHomeWithDoc(id?: string) {
    // ✅ Sidebar’dan seçince "/?doc=..." ile home’a git
    const url = id ? `/?doc=${encodeURIComponent(id)}` : "/"
    router.push(url)
  }

  async function handleNew() {
    const res = await fetch("/api/documents", { method: "POST" })
    if (!res.ok) return
    const created = (await res.json()) as { id?: string }
    await refreshPresentations()
    if (created?.id) await goHomeWithDoc(created.id)
    else router.push("/")
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/documents/${id}/duplicate`, { method: "POST" })
    if (!res.ok) return
    const created = (await res.json()) as { id?: string }
    await refreshPresentations()
    if (created?.id) await goHomeWithDoc(created.id)
  }

  async function handleRename(id: string, nextTitle: string) {
    const res = await fetch(`/api/documents/${id}/meta`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    })
    if (!res.ok) return
    await refreshPresentations()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" })
    if (!res.ok) return

    await refreshPresentations()

    // Eğer aktif olanı sildiysek home’da latest’e dönelim
    const isActiveDeleted = activeId === id
    if (isActiveDeleted) {
      router.push("/")
      // HomeClient zaten latest yükleyecek
    }
  }

  // ✅ Home, About, Profile… hepsi aynı chrome/layout ile render olsun → geçiş “siyah flash” azalır
  const isHome = pathname === "/"

  return (
    <PresentationsProvider value={{ refreshPresentations }}>
      <div className="flex h-screen bg-zinc-950 text-zinc-100">
        <Sidebar
          user={user}
          presentations={presentations}
          activeId={activeId}
          onSelect={(id) => {
            // Home’da da About/Profile’da da aynı davranış
            goHomeWithDoc(id)
          }}
          onNew={handleNew}
          onRename={handleRename}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />

        {/* Home zaten full height / overflow hidden kullanıyor, diğerleri overflow-auto */}
        <main className={isHome ? "flex-1 overflow-hidden" : "flex-1 overflow-auto"}>
          {children}
        </main>
      </div>
    </PresentationsProvider>
  )
}
