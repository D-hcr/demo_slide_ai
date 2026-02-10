export function extractSlidesFromContent(content: any): any[] {
  if (!content) return []

  if (typeof content === "string") {
    try {
      return extractSlidesFromContent(JSON.parse(content))
    } catch {
      return []
    }
  }

  if (Array.isArray(content)) {
    return [...content] // 🔒 order garanti
  }

  if (typeof content === "object") {
    if (Array.isArray(content.slides)) return [...content.slides]
    if (Array.isArray(content.content)) return [...content.content]

    const deckSlides = content?.artifact?.state?.deck?.slides
    if (Array.isArray(deckSlides)) return [...deckSlides]

    const altDeck = content?.artifact?.deck?.slides
    if (Array.isArray(altDeck)) return [...altDeck]
  }

  return []
}

export function getExportDebugInfo(content: any) {
  return {
    type: typeof content,
    keys: content && typeof content === "object" ? Object.keys(content) : null,
    hasArtifact: !!content?.artifact,
    slidesLen: Array.isArray(content?.artifact?.state?.deck?.slides)
      ? content.artifact.state.deck.slides.length
      : null,
  }
}
