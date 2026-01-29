import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/* ======================= */
/* UPDATE DOCUMENT (PATCH) */
/* ======================= */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ✅ Next 16: params Promise geliyor, await şart
  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "Document ID missing" }, { status: 400 })
  }

  const body = await req.json()
  const { title, slides, themeName } = body

  if (!Array.isArray(slides)) {
    return NextResponse.json({ error: "Invalid slides payload" }, { status: 400 })
  }

  const updated = await prisma.document.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      title,
      content: slides, // 🔥 DB’de content, API’de slides
      themeName,
    },
  })

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    slides: updated.content,
    themeName: updated.themeName,
    updatedAt: updated.updatedAt,
  })
}

/* ======================= */
/* GET DOCUMENT (GET) */
/* ======================= */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ✅ burada da await
  const { id } = await context.params

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    id: document.id,
    title: document.title,
    slides: document.content,
    themeName: document.themeName,
    updatedAt: document.updatedAt,
  })
}
/* ======================= */
/* DELETE DOCUMENT (DELETE) */
/* ======================= */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "Document ID missing" }, { status: 400 })
  }

  await prisma.document.delete({
    where: {
      id,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
