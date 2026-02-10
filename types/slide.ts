// /home/hacer/Desktop/slied_project/slide-ai/types/slide.ts

export type DeckMeta = {
  topic?: string
  audience?: string
  tone?: string
}

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
  meta?: DeckMeta // ✅ NEW
}

export interface SlideDeckResponse {
  id?: string
  title?: string
  slides?: Slide[]
  content?: any
  themeName?: string
  meta?: DeckMeta // ✅ NEW
  pastLen?: number
  futureLen?: number
  version?: number
}

/** ✅ NEW THEME MODEL (UI + Export ortak) */
export type SlideTheme = {
  name: string

  backgroundClass: string
  textClass: string
  accentClass: string

  titleSize: string
  bulletSize: string
  fontFamily: string

  palette: {
    background: string
    foreground: string
    accent: string
    muted: string
  }

  gradient?: {
    enabled: boolean
    direction: "top-bottom" | "bottom-top" | "left-right" | "right-left"
    from: string
    to: string
  }

  overlay?: {
    enabled: boolean
    color: string
    opacity: number
  }

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

export type ArtifactType = "slides"
export type ArtifactStatus = "ready" | "loading" | "error"

export type ArtifactMeta = {
  status?: ArtifactStatus
  error?: string | null
  lastAction?: "create" | "update" | "regenerate" | "manual-edit" | "export" | "undo" | "redo" | null
}

export type SlidesArtifactState = {
  deck: SlideDeck
  past?: SlideDeck[] // ✅ undo stack
  future?: SlideDeck[] // ✅ redo stack
  history?: SlideDeck[] // backward compat
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
