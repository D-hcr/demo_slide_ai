import { auth } from "@/lib/auth"

export default async function ProfilePage() {
  const session = await auth()

  return (
    <div className="h-full w-full">
      <div className="max-w-3xl mx-auto p-8">
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
          <div className="text-xl font-bold text-white">Profil</div>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <div><span className="text-zinc-500">Ad:</span> {session?.user?.name ?? "-"}</div>
            <div><span className="text-zinc-500">E-posta:</span> {session?.user?.email ?? "-"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
