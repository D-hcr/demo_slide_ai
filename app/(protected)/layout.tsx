import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import SessionProvider from "@/components/ui/SessionProvider"
import ProtectedChrome from "@/components/layout/ProtectedChrome"

import { db, schema } from "@/db"
import { desc, eq } from "drizzle-orm"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?from=/")

  // ✅ Sidebar listesi için sunumları burada çek (About/Profile’da da görünsün)
  const docs = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      updatedAt: schema.documents.updatedAt,
    })
    .from(schema.documents)
    .where(eq(schema.documents.userId, session.user.id))
    .orderBy(desc(schema.documents.updatedAt))
    .limit(100)

  const presentations = docs.map((d) => ({
    id: d.id,
    title: d.title ?? "Untitled",
    updatedAt: new Date(d.updatedAt).toISOString(),
  }))

  return (
    <SessionProvider session={session}>
      <ProtectedChrome user={session.user} presentations={presentations}>
        {children}
      </ProtectedChrome>
    </SessionProvider>
  )
}
