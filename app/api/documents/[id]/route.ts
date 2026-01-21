import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const body = await req.json()
  const { id, content, title, themeName } = body

  if (!id) {
    return NextResponse.json(
      { error: "Document id missing" },
      { status: 400 }
    )
  }

  const document = await prisma.document.update({
    where: {
      id,
      userId: session.user.id, // 🔐 güvenlik
    },
    data: {
      title,
      content,
      themeName,
    },
  })

  return NextResponse.json(document)
}