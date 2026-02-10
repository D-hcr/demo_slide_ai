// /app/documents/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import SlideWorkspace from "@/components/slides/SlideWorkspace"
import { auth } from "@/lib/auth"
import { extractSlidesStateFromDoc } from "@/lib/artifacts/slidesArtifact"
import { db, schema } from "@/db"
import { and, eq } from "drizzle-orm"

type PageProps = { params: Promise<{ id: string }> }

export default async function DocumentPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?from=/")

  const { id } = await params

  const rows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      content: schema.documents.content,
      themeName: schema.documents.themeName,
      updatedAt: schema.documents.updatedAt,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const document = rows[0]
  if (!document) notFound()

  const extracted = extractSlidesStateFromDoc({
    id: document.id,
    title: document.title,
    themeName: document.themeName ?? "Default",
    content: document.content,
  } as any)

  const deck = extracted.state.deck

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <SlideWorkspace
        deck={{
          id: document.id,
          title: deck.title ?? document.title,
          slides: deck.slides ?? [],
          themeName: deck.themeName ?? document.themeName ?? "Default",
        } as any}
        deckId={document.id}
        deckVersion={new Date(document.updatedAt).getTime()}
      />
    </div>
  )
}
