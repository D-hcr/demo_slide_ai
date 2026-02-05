import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import SlideWorkspace from "@/components/slides/SlideWorkspace"
import { auth } from "@/lib/auth"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DocumentPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/") // veya "/login"
  }

  const { id } = await params

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: session.user.id, // ✅ kritik fix
    },
  })

  if (!document) notFound()

  // Not: Senin güncel yapın artifact envelope.
  // Burayı şimdilik legacy gibi bırakmışsın; ileride Adım 2’de extract helper ile düzelteceğiz.
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
