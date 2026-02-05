import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { regenerateSlideText, regenerateSlideImagePrompt } from "@/lib/groq"
import type { Slide } from "@/types/slide"

/**
 * Body:
 * {
 *   documentId: string
 *   slideId: string
 *   mode: "text" | "imagePrompt"
 * }
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { documentId, slideId, mode } = body ?? {}

  if (!documentId || !slideId || !mode) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.user.id },
    select: { id: true, content: true, title: true, themeName: true, version: true },
  })

  const content = doc?.content as any

  if (!doc || !content || typeof content !== "object" || !content.artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 })
  }

  const artifact = content.artifact as any
  const deck = artifact.state.deck
  const slides: Slide[] = Array.isArray(deck.slides) ? deck.slides : []

  const index = slides.findIndex((s) => s.id === slideId)
  if (index === -1) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 })
  }

  const targetSlide = slides[index]

  // 🔹 LLM CALL
  let updatedFields: Partial<Slide> = {}

  if (mode === "text") {
    updatedFields = await regenerateSlideText(targetSlide)
  }

  if (mode === "imagePrompt") {
    updatedFields = await regenerateSlideImagePrompt(targetSlide)
  }

  const nextSlides = slides.map((s, i) =>
    i === index ? { ...s, ...updatedFields } : s
  )

  // 🔹 HISTORY + VERSION
  const nextContent = {
    artifact: {
      ...artifact,
      version: artifact.version + 1,
      meta: {
        ...artifact.meta,
        lastAction: "regenerate",
      },
      state: {
        deck: {
          ...deck,
          slides: nextSlides,
        },
        history: [
          deck,
          ...(artifact.state.history ?? []),
        ].slice(0, 20),
      },
      updatedAt: new Date().toISOString(),
    },
  }

  await prisma.document.update({
    where: { id: doc.id },
    data: {
      content: JSON.parse(JSON.stringify(nextContent)),
      version: { increment: 1 },
    },
  })

  return NextResponse.json({
    slide: nextSlides[index],
    version: artifact.version + 1,
  })
}