import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { runDeckChatCommand } from "@/lib/deckChat"

function newStableId(maxId: number) {
  // her normalize çağrısında maxId+1 üret
  return maxId + 1
}

function normalizeSlides(input: any): { slides: any[]; changed: boolean } {
  const arr = Array.isArray(input) ? input : []
  let changed = false

  const slides = arr.map((s, idx) => {
    let id = s?.id

    // ✅ her koşulda string’e çevir
    if (typeof id === "number") {
      id = String(id)
      changed = true
    }

    const idOk = typeof id === "string" && id.trim().length > 0
    if (!idOk) {
      id = crypto.randomUUID()
      changed = true
    }

    const title =
      typeof s?.title === "string"
        ? s.title
        : s?.title != null
          ? String(s.title)
          : "Başlıksız"

    const bulletsRaw = s?.bullets
    const bullets = Array.isArray(bulletsRaw)
      ? bulletsRaw.map((b: any) => String(b ?? "")).filter((x: string) => x.trim().length > 0)
      : []

    const imagePrompt =
      typeof s?.imagePrompt === "string"
        ? s.imagePrompt
        : s?.imagePrompt != null
          ? String(s.imagePrompt)
          : ""

    return {
      ...s,
      id,
      title,
      bullets,
      imagePrompt,
      _order: typeof s?._order === "number" ? s._order : idx,
    }
  })

  return { slides, changed }
}


export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
      title: true,
      content: true,
      themeName: true,
      updatedAt: true,
    },
  })

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const norm = normalizeSlides(doc.content)

  // ✅ Eğer DB’de id’siz slayt vardıysa, burada kalıcı olarak düzelt.
  if (norm.changed) {
    await prisma.document.update({
      where: { id: doc.id, userId: session.user.id },
      data: { content: JSON.parse(JSON.stringify(norm.slides)) },
    })
  }

  return NextResponse.json({
    messages: doc.messages,
    deck: {
      id: doc.id,
      title: doc.title,
      slides: norm.slides,
      themeName: doc.themeName ?? "Default",
      updatedAt: doc.updatedAt,
    },
  })
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const body = await req.json().catch(() => null)
  const text = body?.text

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 })
  }

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 1) user message kaydet
  await prisma.chatMessage.create({
    data: { documentId: id, role: "user", content: text },
  })

  // 2) son 30 mesajı al
  const recentDesc = await prisma.chatMessage.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { role: true, content: true },
  })
  const recent = recentDesc.reverse()

  // ✅ her requestte stabil normalize + gerekirse DB düzelt
  const norm = normalizeSlides(doc.content)
  if (norm.changed) {
    await prisma.document.update({
      where: { id: doc.id, userId: session.user.id },
      data: { content: JSON.parse(JSON.stringify(norm.slides)) },
    })
  }

  const currentSlides = norm.slides

  // 3) LLM komut çalıştır
  const result = await runDeckChatCommand({
    userText: text,
    deck: {
      id: doc.id,
      title: doc.title,
      slides: currentSlides,
      themeName: doc.themeName ?? "Default",
    },
    messages: recent,
  })

  // 4) deck güncellendiyse DB’ye yaz
  if (result.updatedDeck) {
    const nextNorm = normalizeSlides(result.updatedDeck.slides)

    // ✅ LLM boş döndürürse eskisini koru
    const finalSlides =
      currentSlides.length > 0 && nextNorm.slides.length === 0 ? currentSlides : nextNorm.slides

    await prisma.document.update({
      where: { id, userId: session.user.id },
      data: {
        title: result.updatedDeck.title ?? doc.title,
        content: JSON.parse(JSON.stringify(finalSlides)),
        themeName: result.updatedDeck.themeName ?? doc.themeName ?? "Default",
      },
    })
  }

  // 5) assistant mesajını kaydet
  await prisma.chatMessage.create({
    data: {
      documentId: id,
      role: "assistant",
      content: result.assistantText,
    },
  })

  // 6) güncel state dön
  const outDoc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      content: true,
      themeName: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  })

  const outNorm = normalizeSlides(outDoc?.content)

  return NextResponse.json({
    messages: outDoc?.messages ?? [],
    deck: outDoc
      ? {
          id: outDoc.id,
          title: outDoc.title,
          slides: outNorm.slides,
          themeName: outDoc.themeName ?? "Default",
          updatedAt: outDoc.updatedAt,
        }
      : null,
  })
}
