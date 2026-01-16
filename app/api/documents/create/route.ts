import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.create({
    data: {
      title: "Untitled Slide",
      content: "",
      userId: session.user.id,
    },
  });

  return NextResponse.json(document);
}
