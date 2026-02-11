"use client"

import { createContext, useContext } from "react"

type PresentationsCtx = {
  refreshPresentations: () => Promise<void>
}

const Ctx = createContext<PresentationsCtx | null>(null)

export function PresentationsProvider({
  value,
  children,
}: {
  value: PresentationsCtx
  children: React.ReactNode
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePresentations() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("usePresentations must be used inside PresentationsProvider")
  return ctx
}
