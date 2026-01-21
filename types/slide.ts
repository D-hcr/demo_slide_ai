export interface Slide {
  id: number
  title: string
  bullets: string[]
  imagePrompt: string
  notes?: string
}

export interface SlideDeck {
  id?: string           
  title: string
  description?: string
  slides: Slide[]
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
}
