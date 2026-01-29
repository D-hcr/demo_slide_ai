// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlides } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

    const slideDeck = await generateSlides(topic);

    // ✅ slides garanti: yoksa boş array
    const slides = Array.isArray((slideDeck as any)?.slides)
      ? (slideDeck as any).slides
      : Array.isArray((slideDeck as any)?.content)
      ? (slideDeck as any).content
      : [];

    // ✅ DB'ye kaydet
    const doc = await prisma.document.create({
      data: {
        title: slideDeck.title ?? "Yeni Sunum",
        content: slides, // <-- autosave ile uyumlu
        themeName: slideDeck.themeName ?? "default",
        userId: session.user.id,
      },
    });

    // ✅ FRONTEND'E DB ID DÖN (en kritik nokta)
    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      slides: slides,
      themeName: doc.themeName,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Slide generation failed" }, { status: 500 });
  }
}
