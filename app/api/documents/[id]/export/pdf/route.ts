// /app/api/documents/[id]/export/pdf/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { and, eq } from "drizzle-orm"
import { getThemeByName } from "@/lib/slideThemes"
import { extractSlidesFromContent, getExportDebugInfo } from "@/lib/export/slidesExtract"
import { buildSlidesHtml } from "@/lib/export/pdfTemplate"
import { toDataUri } from "@/lib/export/imageData"
import { renderHtmlToPdfBuffer } from "@/lib/export/puppeteerPdf"

export const maxDuration = 120 
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeFilename(name: string) {
  const base = (name || "sunum").trim()
  const cleaned = base.replace(/[\/\\:*?"<>|]+/g, "-")
  return cleaned.slice(0, 120) || "sunum"
}

function safeJson(raw: any) {
  if (!raw) return null
  if (typeof raw === "string") {
    try { return JSON.parse(raw) } catch { return null }
  }
  if (typeof raw === "object") return raw
  return null
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const rows = await db
    .select({
      id: schema.documents.id,
      title: schema.documents.title,
      themeName: schema.documents.themeName,
      content: schema.documents.content,
      userId: schema.documents.userId,
    })
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, session.user.id)))
    .limit(1)

  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rawAny = doc.content as any
  const slides = extractSlidesFromContent(rawAny)

  if (!slides.length) {
    const isDev = process.env.NODE_ENV !== "production"
    return NextResponse.json(
      isDev ? { error: "No slides to export", debug: getExportDebugInfo(rawAny) } : { error: "No slides to export" },
      { status: 400 }
    )
  }

  // meta update (scoped)
  const rawObj = safeJson(rawAny) ?? rawAny
  if (rawObj && typeof rawObj === "object") {
    await db
      .update(schema.documents)
      .set({
        content: {
          ...(rawObj ?? {}),
          artifact: {
            ...((rawObj as any)?.artifact ?? {}),
            meta: {
              ...((rawObj as any)?.artifact?.meta ?? {}),
              lastAction: "export",
              lastExport: "pdf",
            },
          },
        } as any,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.documents.id, doc.id), eq(schema.documents.userId, session.user.id)))
  }

  // ✅ Görselleri data-uri embed et (PDF’de dış istek azalır)
  const slidesWithImages = await Promise.all(
    slides.map(async (s: any) => {
      const url = typeof s.imageUrl === "string" ? s.imageUrl : ""
      if (!url) return s
      const data = await toDataUri(req, url, 25_000)
      return { ...s, imageUrl: data || url }
    })
  )

  const theme = getThemeByName(doc.themeName ?? "Default")
  const html = buildSlidesHtml(slidesWithImages, theme)

  const pdfBuffer = await renderHtmlToPdfBuffer(html)

  const filename = encodeURIComponent(safeFilename(doc.title) + ".pdf")

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Cache-Control": "no-store",
    },
  })
}
