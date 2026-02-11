// /components/sidebar/Sidebar.tsx
"use client"

import { signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import UserProfile from "./UserProfile"
import PresentationList from "./PresentationList"

export default function Sidebar({
  user,
  presentations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onDuplicate,
}: {
  user: any
  presentations: any[]
  activeId?: string
  onSelect: (id: string) => void
  onNew: () => void
  onRename: (id: string, nextTitle: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const navBtn = (href: string, label: string) => {
    const active = pathname === href
    return (
      <button
        onClick={() => router.push(href)}
        className={[
          "flex-1 rounded-md px-3 py-2 text-xs border transition",
          active
            ? "bg-zinc-800 text-white border-zinc-700"
            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-white",
        ].join(" ")}
      >
        {label}
      </button>
    )
  }

  return (
    <aside className="w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
      <UserProfile name={user?.name} email={user?.email} image={user?.image} />

      {/* ✅ Top nav (About / Profil / Çıkış) */}
      <div className="px-4 pt-3 pb-4 border-b border-zinc-800 space-y-3">
        <div className="flex gap-2">
          {navBtn("/about", "About")}
          {navBtn("/profile", "Profil")}
        </div>

        <button
          onClick={() => signOut()}
          className="w-full rounded-md px-3 py-2 text-xs bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800"
        >
          Çıkış
        </button>
      </div>

      {/* ✅ Burada artık ekstra New yok. Tek New PresentationList içinde. */}
      <PresentationList
        items={presentations}
        activeId={activeId}
        onSelect={(id) => {
          onSelect(id)
          // About/Profile'dan bir sunuma tıklayınca ana ekrana dönsün (UX pro)
          if (pathname !== "/") router.push("/")
        }}
        onNew={() => {
          onNew()
          if (pathname !== "/") router.push("/")
        }}
        onRename={onRename}
        onDelete={onDelete}
        onDuplicate={(id) => {
          onDuplicate(id)
          if (pathname !== "/") router.push("/")
        }}
      />
    </aside>
  )
}
