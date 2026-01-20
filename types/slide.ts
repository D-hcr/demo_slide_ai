export interface SlideDeck {
  title: string
  description?: string
  slides: Slide[]
}

export interface Slide {
  id: number
  title: string
  bullets: string[]
  imagePrompt: string
  notes?: string
}
