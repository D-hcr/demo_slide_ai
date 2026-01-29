"use client"

import { signOut } from "next-auth/react"

export default function UserProfile({
  name,
  email,
  image,
}: {
  name?: string | null
  email?: string | null
  image?: string | null
}) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
      <img
        src={image || "/avatar.png"}
        className="h-10 w-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-100 truncate">
          {name}
        </div>
        <div className="text-xs text-zinc-400 truncate">
          {email}
        </div>
      </div>

      <button
        onClick={() => signOut()}
        className="text-xs text-zinc-400 hover:text-white"
      >
        Çıkış
      </button>
    </div>
  )
}
