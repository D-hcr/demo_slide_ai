import { SlideTheme } from "@/types/slide"

export const defaultTheme: SlideTheme = {
  name: "Default",
  background: "bg-white",
  text: "text-zinc-900",
  accent: "text-blue-600",
  titleSize: "text-3xl",
  bulletSize: "text-lg",
  fontFamily: "font-sans",
}

export const darkTheme: SlideTheme = {
  name: "Dark",
  background: "bg-zinc-900",
  text: "text-zinc-100",
  accent: "text-blue-400",
  titleSize: "text-3xl",
  bulletSize: "text-lg",
  fontFamily: "font-sans",
}

export const slideThemes: SlideTheme[] = [
  defaultTheme,
  darkTheme,
]

export function getThemeByName(name?: string): SlideTheme {
  return slideThemes.find(t => t.name === name) ?? defaultTheme
}
