import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/* ======================= */
/* LIST DOCUMENTS (GET) */
/* ======================= */
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const documents = await prisma.document.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(documents)
}

/* ======================= */
/* CREATE DOCUMENT (POST) */
/* ======================= */
export async function POST() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const doc = await prisma.document.create({
    data: {
      title: "Yeni Sunum",
      content: [],
      themeName: "Default",
      userId: session.user.id,
    },
  })

  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    slides: [],
    themeName: doc.themeName,
  })
}
