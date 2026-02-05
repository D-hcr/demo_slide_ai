// /types/slide.ts

export interface Slide {
  id: string
  title: string
  bullets: string[]
  imagePrompt: string
  imageUrl?: string
  layout?: "text-left" | "image-left" | "full-image"
  style?: {
    background?: string
    accent?: string
  }
  notes?: string
}

export interface SlideDeck {
  id: string
  title: string
  slides: Slide[]
  themeName: string
  history?: SlideDeck[]
}

export interface SlideDeckResponse {
  id: string
  title?: string
  slides?: Slide[]
  content?: Slide[]
  themeName?: string
  history?: SlideDeck[]
  historyLen?: number
}

/** ✅ NEW THEME MODEL (UI + Export ortak) */
export type SlideTheme = {
  name: string

  // Tailwind class (UI için)
  backgroundClass: string
  textClass: string
  accentClass: string

  // Typography (UI)
  titleSize: string
  bulletSize: string
  fontFamily: string

  // Hex palette (Export + UI inline style için)
  palette: {
    background: string
    foreground: string
    accent: string
    muted: string
  }

  // Gradient opsiyonel
  gradient?: {
    enabled: boolean
    direction: "top-bottom" | "bottom-top" | "left-right" | "right-left"
    from: string
    to: string
  }

  // Overlay opsiyonel (full-image vb)
  overlay?: {
    enabled: boolean
    color: string
    opacity: number // 0..1
  }

  // İleri seviye rules
  imageStyle?: {
    radius: number
    shadow: boolean
    overlayOnImage: boolean
  }

  exportRules?: {
    pdf?: { forceExactColors: boolean }
    pptx?: { allowOverlay: boolean }
  }
}

/** Artifact types (aynı kalabilir) */
export type ArtifactType = "slides"
export type ArtifactStatus = "ready" | "loading" | "error"

export type ArtifactMeta = {
  status?: ArtifactStatus
  error?: string | null
  lastAction?: "create" | "update" | "regenerate" | "manual-edit" | "export" | "undo" | null
}

export type SlidesArtifactState = {
  deck: SlideDeck
  history?: SlideDeck[]
}

export type SlidesArtifact = {
  id: string
  type: "slides"
  title: string
  version: number
  state: SlidesArtifactState
  meta?: ArtifactMeta
  createdAt?: string
  updatedAt?: string
}

export type DocumentContent =
  | {
      artifact: SlidesArtifact
    }
  | null
