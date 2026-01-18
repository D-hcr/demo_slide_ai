import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, topic } = await req.json();

  if (!title || !topic) {
    return NextResponse.json(
      { error: "Title or topic missing" },
      { status: 400 }
    );
  }

  const document = await prisma.document.create({
    data: {
      title,
      content: `Generated slides about: ${topic}`,
      userId: session.user.id,
    },
  });

  return NextResponse.json(document);
}