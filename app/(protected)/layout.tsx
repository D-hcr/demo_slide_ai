// /app/(protected)/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import SessionProvider from "@/components/ui/SessionProvider"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?from=/")
  }

  return <SessionProvider session={session}>{children}</SessionProvider>
}
