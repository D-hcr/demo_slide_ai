// /app/api/documents/[id]/export/pptx/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, schema } from "@/db"
import { and, eq } from "drizzle-orm"
import { getThemeByName } from "@/lib/slideThemes"
import { extractSlidesFromContent, getExportDebugInfo } from "@/lib/export/slidesExtract"
import { buildPptxBuffer } from "@/lib/export/pptxTemplate"
import { toDataUri } from "@/lib/export/imageData"

export const dynamic = "force-dynamic"

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

function normalizeLayoutForExport(s: any) {
  const layout = (s?.layout as string) || "text-left"
  const hasImage = !!(s?.imageUrl || s?.imageData || (typeof s?.imagePrompt === "string" && s.imagePrompt.trim()))
  if (layout === "full-image" && !hasImage) return "text-left"
  if (layout === "image-left" || layout === "text-left" || layout === "full-image") return layout
  return "text-left"
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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

  // meta update
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
            },
          },
        } as any,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.documents.id, doc.id), eq(schema.documents.userId, session.user.id)))
  }

  // imageData embed
  const prepared = await Promise.all(
    slides.map(async (s: any) => {
      const imageUrl = typeof s.imageUrl === "string" ? s.imageUrl : ""
      const alreadyData = imageUrl.startsWith("data:") ? imageUrl : ""
      const imageData = alreadyData || (imageUrl ? await toDataUri(req, imageUrl) : "")
      return { ...s, layout: normalizeLayoutForExport(s), imageData: imageData || "" }
    })
  )

  const theme = getThemeByName(doc.themeName ?? "Default")
  const buffer = await buildPptxBuffer({
    slides: prepared,
    theme,
    deckTitle: doc.title ?? "Sunum",
  })

  const filename = encodeURIComponent(safeFilename(doc.title) + ".pptx")

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Cache-Control": "no-store",
    },
  })
}
