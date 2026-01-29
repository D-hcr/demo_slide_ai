import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Document ID missing" }, { status: 400 });
  }

  const src = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!src) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const copy = await prisma.document.create({
    data: {
      title: `${src.title} (Kopya)`,
      content: src.content ?? [],
      themeName: src.themeName ?? "Default",
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      themeName: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(copy);
}
