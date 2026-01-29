import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import SlideWorkspace from "@/components/slides/SlideWorkspace"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params

  const document = await prisma.document.findFirst({
    where: { id },
  })

  if (!document) notFound()

  const slides = Array.isArray(document.content) ? (document.content as any[]) : []

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <SlideWorkspace
        deck={{
          id: document.id,
          title: document.title,
          slides,
          themeName: document.themeName ?? "Default",
        } as any}
        deckId={document.id}
        deckVersion={document.updatedAt.getTime()}
      />
    </div>
  )
}
