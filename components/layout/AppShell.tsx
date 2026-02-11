"use client"

export default function AppShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-900">
      {sidebar}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
