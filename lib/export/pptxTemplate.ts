// /lib/export/pptxTemplate.ts
import PptxGenJS from "pptxgenjs"
import type { SlideTheme } from "@/types/slide"

type AnySlide = {
  id?: string
  title?: string
  bullets?: string[]
  imageUrl?: string
  imageData?: string
  imagePrompt?: string
  layout?: "text-left" | "image-left" | "full-image" | string
}

function clampBullets(bullets: any): string[] {
  if (!Array.isArray(bullets)) return []
  return bullets.map((b) => String(b ?? "").trim()).filter(Boolean).slice(0, 10)
}

function hex(input: string | undefined | null, fallback: string) {
  const s = String(input || "").trim()
  const v = s.startsWith("#") ? s.slice(1) : s
  return /^[0-9a-fA-F]{6}$/.test(v) ? v : fallback
}

function fitFontSizeByLength(text: string, base: number, min: number) {
  const n = (text || "").length
  if (n <= 24) return base
  if (n <= 45) return Math.max(min, base - 4)
  if (n <= 70) return Math.max(min, base - 8)
  return min
}

function opacityToPptxTransparency(opacity: number) {
  // pptxgenjs: 0 = opak, 100 = şeffaf
  const clamped = Math.max(0, Math.min(1, opacity))
  return Math.round((1 - clamped) * 100)
}

function normalizeLayoutForExport(s: AnySlide) {
  const layout = (s?.layout as string) || "text-left"
  const hasImage = !!(s?.imageData && s.imageData.startsWith("data:"))
  if (layout === "full-image" && !hasImage) return "text-left"
  if (layout === "image-left" || layout === "text-left" || layout === "full-image") return layout
  return "text-left"
}

export async function buildPptxBuffer(args: {
  slides: AnySlide[]
  theme: SlideTheme
  deckTitle: string
}) {
  const pptx = new PptxGenJS()
  pptx.layout = "LAYOUT_WIDE"

  const W = 13.333
  const H = 7.5

  const bg = hex(args.theme.palette?.background ?? (args.theme as any).exportBackground, "FFFFFF")
  const fg = hex(args.theme.palette?.foreground ?? (args.theme as any).exportText, "111111")
  const accent = hex(args.theme.palette?.accent ?? (args.theme as any).exportAccent, "2563EB")
  const muted = hex(args.theme.palette?.muted ?? "64748b", "64748b")

  const allowOverlay = args.theme.exportRules?.pptx?.allowOverlay !== false
  const overlayEnabled = allowOverlay && !!(args.theme.overlay?.enabled || args.theme.imageStyle?.overlayOnImage)
  const overlayColor = hex(args.theme.overlay?.color ?? "#000000", "000000")
  const overlayOpacity =
    typeof args.theme.overlay?.opacity === "number" ? args.theme.overlay.opacity : 0.55

  for (let idx = 0; idx < args.slides.length; idx++) {
    const s = args.slides[idx]
    const slide = pptx.addSlide()

    slide.background = { color: bg }

    const title = String(s?.title ?? "").trim() || "Slide Title"
    const bullets = clampBullets(s?.bullets)
    const layout = normalizeLayoutForExport(s)
    const titleSize = fitFontSizeByLength(title, 36, 24)

    // accent bar + meta
    slide.addShape(pptx.ShapeType.roundRect as any, {
      x: 0.85,
      y: 0.5,
      w: 1.0,
      h: 0.12,
      fill: { color: accent },
      line: { color: accent, transparency: 100 },
    } as any)

    slide.addText(`Slide ${idx + 1}`, {
      x: 1.95,
      y: 0.44,
      w: 2.5,
      h: 0.35,
      fontFace: "Arial",
      fontSize: 12,
      color: fg,
      transparency: 45,
    })

    const dataUri = (s?.imageData && s.imageData.startsWith("data:")) ? s.imageData : null

    // =========================
    // FULL IMAGE
    // =========================
    if (layout === "full-image") {
      if (dataUri) {
        slide.addImage({ data: dataUri, x: 0, y: 0, w: W, h: H })
      }

      if (overlayEnabled) {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: W,
          h: H,
          fill: { color: overlayColor, transparency: opacityToPptxTransparency(overlayOpacity) },
          line: { color: overlayColor, transparency: 100 },
        })
      }

      slide.addText(title, {
        x: 0.95,
        y: 1.25,
        w: W - 1.9,
        h: 1.0,
        fontFace: "Arial",
        fontSize: titleSize,
        bold: true,
        color: "FFFFFF",
      })

      const bulletText = bullets.length ? bullets.map((b) => `• ${b}`).join("\n") : ""
      slide.addText(bulletText, {
        x: 1.05,
        y: 2.35,
        w: W - 2.1,
        h: H - 3.1,
        fontFace: "Arial",
        fontSize: 20,
        color: "FFFFFF",
        lineSpacingMultiple: 1.2,
      })

      slide.addText("Slide AI", {
        x: W - 2.0,
        y: H - 0.45,
        w: 1.8,
        h: 0.3,
        fontFace: "Arial",
        fontSize: 10,
        color: "FFFFFF",
        transparency: 60,
        align: "right",
      })

      continue
    }

    // =========================
    // STANDARD layouts
    // =========================
    slide.addText(title, {
      x: 0.85,
      y: 0.85,
      w: W - 1.7,
      h: 0.9,
      fontFace: "Arial",
      fontSize: titleSize,
      bold: true,
      color: fg,
    })

    const leftIsImage = layout === "image-left"
    const imgW = 5.1
    const imgH = 4.9
    const imgX = leftIsImage ? 0.85 : W - 0.85 - imgW
    const imgY = 2.0

    const textX = leftIsImage ? 0.85 + imgW + 0.6 : 0.85
    const textW = leftIsImage ? W - textX - 0.85 : W - 0.85 - imgW - 0.6 - 0.85

    // image card bg
    slide.addShape(pptx.ShapeType.roundRect as any, {
      x: imgX,
      y: imgY,
      w: imgW,
      h: imgH,
      fill: { color: "F4F4F5" },
      line: { color: "E4E4E7" },
    } as any)

    if (dataUri) {
      slide.addImage({ data: dataUri, x: imgX, y: imgY, w: imgW, h: imgH })
    } else {
      slide.addText("Görsel yok", {
        x: imgX,
        y: imgY + imgH / 2 - 0.2,
        w: imgW,
        h: 0.4,
        align: "center",
        fontFace: "Arial",
        fontSize: 14,
        color: muted,
      })
    }

    const bulletText = bullets.length ? bullets.map((b) => `• ${b}`).join("\n") : "• Bullet text"
    slide.addText(bulletText, {
      x: textX,
      y: 2.05,
      w: textW,
      h: H - 2.5,
      fontFace: "Arial",
      fontSize: 20,
      color: fg,
      lineSpacingMultiple: 1.18,
    })

    slide.addText("Slide AI", {
      x: W - 2.0,
      y: H - 0.45,
      w: 1.8,
      h: 0.3,
      fontFace: "Arial",
      fontSize: 10,
      color: fg,
      transparency: 60,
      align: "right",
    })
  }

  const out = await pptx.write({ outputType: "nodebuffer" })
  return Buffer.from(out as any)
}
