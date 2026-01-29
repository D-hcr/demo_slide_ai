export interface Slide {
  id: string // ✅ string yap
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
}

/* 🔥 API'DEN GELEN HAM RESPONSE */
export interface SlideDeckResponse {
  id: string
  title?: string
  slides?: Slide[]
  content?: Slide[]
  themeName?: string
}

export type SlideTheme = {
  name: string
  background: string
  text: string
  accent: string
  titleSize: string
  bulletSize: string
  fontFamily: string

  exportBackground: string
  exportText: string
  exportAccent: string
}
