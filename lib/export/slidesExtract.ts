// lib/export/slidesExtract.ts

/**
 * ✅ DB'deki content yapıları (backward compatible):
 * 1) Slide[]  (legacy)
 * 2) { slides: Slide[] }
 * 3) { content: Slide[] } (bazı eski response şekilleri)
 * 4) { artifact: { state: { deck: { slides: Slide[] }}}} ✅ güncel format
 * 5) JSON string
 */

export function extractSlidesFromContent(content: any): any[] {
  if (!content) return []

  // JSON string ise parse et
  if (typeof content === "string") {
    try {
      return extractSlidesFromContent(JSON.parse(content))
    } catch {
      return []
    }
  }

  // Direkt array ise (legacy)
  if (Array.isArray(content)) return content

  if (typeof content === "object") {
    // legacy olasılıklar
    if (Array.isArray((content as any).slides)) return (content as any).slides
    if (Array.isArray((content as any).content)) return (content as any).content

    // ✅ NEW: artifact envelope
    const deckSlides = (content as any)?.artifact?.state?.deck?.slides
    if (Array.isArray(deckSlides)) return deckSlides

    // (opsiyonel) bazı sürümlerde artifact.deck gibi gelebilir
    const altDeckSlides = (content as any)?.artifact?.deck?.slides
    if (Array.isArray(altDeckSlides)) return altDeckSlides
  }

  return []
}

export function getExportDebugInfo(content: any) {
  const raw = content
  return {
    contentType: typeof raw,
    isArray: Array.isArray(raw),
    keys: raw && typeof raw === "object" ? Object.keys(raw) : null,
    hasArtifact: !!raw?.artifact,
    hasDeck: !!raw?.artifact?.state?.deck,
    deckSlidesLen: Array.isArray(raw?.artifact?.state?.deck?.slides)
      ? raw.artifact.state.deck.slides.length
      : null,
  }
}
