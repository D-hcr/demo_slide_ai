import { SlideTheme } from "@/types/slide"

export const defaultTheme: SlideTheme = {
  name: "Default",
  background: "bg-white",
  text: "text-zinc-900",
  accent: "text-blue-600",
  titleSize: "text-3xl",
  bulletSize: "text-lg",
  fontFamily: "font-sans",

  exportBackground: "#ffffff",
  exportText: "#111111",
  exportAccent: "#2563eb", // blue-600
}

export const darkTheme: SlideTheme = {
  name: "Dark",
  background: "bg-zinc-900",
  text: "text-zinc-100",
  accent: "text-blue-400",
  titleSize: "text-3xl",
  bulletSize: "text-lg",
  fontFamily: "font-sans",

  exportBackground: "#111111",
  exportText: "#ffffff",
  exportAccent: "#60a5fa", // blue-400
}

export const slideThemes: SlideTheme[] = [defaultTheme, darkTheme]

export function getThemeByName(name?: string): SlideTheme {
  return slideThemes.find((t) => t.name === name) ?? defaultTheme
}
