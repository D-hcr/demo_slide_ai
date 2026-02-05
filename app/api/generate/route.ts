import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlides } from "@/lib/groq"

function withIds(slides: any[]) {
  return slides.map((s, i) => ({
    ...s,
    id: crypto.randomUUID(),
    _order: i,
  }))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { topic } = await req.json()
  if (!topic || typeof topic !== "string") {
    return NextResponse.json({ error: "Invalid topic" }, { status: 400 })
  }

  const rawDeck = await generateSlides(topic)
  const slides = withIds(rawDeck.slides ?? [])

  const content = {
    artifact: {
      id: crypto.randomUUID(),
      type: "slides",
      title: rawDeck.title ?? "Yeni Sunum",
      version: 1,
      meta: {
        status: "ready",
        lastAction: "create",
        error: null,
      },
      state: {
        deck: {
          id: "deck",
          title: rawDeck.title ?? "Yeni Sunum",
          themeName: rawDeck.themeName ?? "Default",
          slides,
        },
        history: [],
      },
      updatedAt: new Date().toISOString(),
    },
  }

  const doc = await prisma.document.create({
    data: {
      title: content.artifact.title,
      content,
      themeName: content.artifact.state.deck.themeName,
      userId: session.user.id,
      artifactType: "slides",
    },
  })

  return NextResponse.json({
    id: doc.id,
    title: content.artifact.title,
    slides,
    themeName: content.artifact.state.deck.themeName,
  })
}
