import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getThemeByName } from "@/lib/slideThemes"

import { extractSlidesFromContent, getExportDebugInfo } from "@/lib/export/slidesExtract"
import { buildPptxBuffer } from "@/lib/export/pptxTemplate"
import { toDataUri } from "@/lib/export/imageData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function safeFilename(name: string) {
  const base = (name || "sunum").trim()
  const cleaned = base.replace(/[\/\\:*?"<>|]+/g, "-")
  return cleaned.slice(0, 120) || "sunum"
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, themeName: true, content: true },
  })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const raw = doc.content as any
  const slides = extractSlidesFromContent(raw)

  if (!slides?.length) {
    const isDev = process.env.NODE_ENV !== "production"
    return NextResponse.json(
      isDev ? { error: "No slides to export", debug: getExportDebugInfo(raw) } : { error: "No slides to export" },
      { status: 400 }
    )
  }

  // ✅ PPTX: görselleri data-uri yapıp template’e ver (fetch'e bağımlılık azalır)
  const slidesPrepared = await Promise.all(
    slides.map(async (s: any) => {
      const url = typeof s?.imageUrl === "string" ? s.imageUrl : ""
      if (!url) return s
      const data = await toDataUri(req, url)
      return { ...s, imageData: data || "" }
    })
  )

  const theme = getThemeByName(doc.themeName ?? "Default")

  try {
    const buffer = await buildPptxBuffer({
      slides: slidesPrepared,
      theme,
      deckTitle: doc.title ?? "Sunum",
    })

    const filename = safeFilename(doc.title) + ".pptx"
    const encodedFilename = encodeURIComponent(filename)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "PPTX export failed", message: String(err?.message ?? err) },
      { status: 500 }
    )
  }
}
