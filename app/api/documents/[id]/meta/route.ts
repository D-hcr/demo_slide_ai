import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
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

  const body = await req.json()
  const { title, themeName } = body ?? {}

  if (title !== undefined && typeof title !== "string") {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 })
  }
  if (themeName !== undefined && typeof themeName !== "string") {
    return NextResponse.json({ error: "Invalid themeName" }, { status: 400 })
  }

  const updated = await prisma.document.update({
    where: { id, userId: session.user.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(themeName !== undefined ? { themeName } : {}),
    },
    select: {
      id: true,
      title: true,
      themeName: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(updated)
}
