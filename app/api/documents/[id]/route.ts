import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Context) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Next.js 16: params Promise → await
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Document id missing" },
      { status: 400 }
    );
  }

  const { title, content } = await req.json();

  const document = await prisma.document.update({
    where: {
      id,
      userId: session.user.id, // ✅ güvenlik
    },
    data: {
      title,
      content,
    },
  });

  return NextResponse.json(document);
}
