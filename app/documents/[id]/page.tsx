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

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <SlideWorkspace
        deck={document.content as any}
        deckId={document.id}
      />
    </div>
  )
}