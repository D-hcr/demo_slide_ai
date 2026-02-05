import type { SlideTheme } from "@/types/slide"

const base = {
  titleSize: "text-4xl",
  bulletSize: "text-xl",
  fontFamily: "font-sans",
}

const baseRules = {
  imageStyle: {
    radius: 20,
    shadow: true,
    overlayOnImage: false, // ✅ default: otomatik karartma YOK
  },
  exportRules: {
    pdf: { forceExactColors: true },
    pptx: { allowOverlay: true },
  },
} as const

export const defaultTheme: SlideTheme = {
  name: "Default",
  backgroundClass: "bg-white",
  textClass: "text-zinc-900",
  accentClass: "text-blue-600",
  ...base,

  palette: {
    background: "#ffffff",
    foreground: "#111111",
    accent: "#2563eb",
    muted: "#64748b",
  },

  gradient: { enabled: false, direction: "top-bottom", from: "#ffffff", to: "#ffffff" },
  overlay: { enabled: false, color: "#000000", opacity: 0.35 },

  ...baseRules,
}

export const darkTheme: SlideTheme = {
  name: "Dark",
  backgroundClass: "bg-zinc-950",
  textClass: "text-zinc-50",
  accentClass: "text-sky-300",
  ...base,

  palette: {
    background: "#0b0f19",
    foreground: "#ffffff",
    accent: "#38bdf8",
    muted: "#94a3b8",
  },

  gradient: { enabled: false, direction: "top-bottom", from: "#0b0f19", to: "#0b0f19" },
  overlay: { enabled: false, color: "#000000", opacity: 0.45 },

  ...baseRules,
}

export const sunsetTheme: SlideTheme = {
  name: "Sunset",
  backgroundClass: "bg-orange-50",
  textClass: "text-zinc-900",
  accentClass: "text-orange-600",
  ...base,

  palette: {
    background: "#fff7ed",
    foreground: "#111111",
    accent: "#ea580c",
    muted: "#7c2d12",
  },

  // ✅ örnek gradient preset (kapalı geliyor)
  gradient: { enabled: false, direction: "top-bottom", from: "#fff7ed", to: "#fed7aa" },
  overlay: { enabled: false, color: "#000000", opacity: 0.35 },

  ...baseRules,
}

export const forestTheme: SlideTheme = {
  name: "Forest",
  backgroundClass: "bg-emerald-50",
  textClass: "text-zinc-900",
  accentClass: "text-emerald-700",
  ...base,

  palette: {
    background: "#ecfdf5",
    foreground: "#0f172a",
    accent: "#047857",
    muted: "#065f46",
  },

  gradient: { enabled: false, direction: "top-bottom", from: "#ecfdf5", to: "#bbf7d0" },
  overlay: { enabled: false, color: "#000000", opacity: 0.35 },

  ...baseRules,
}

export const royalTheme: SlideTheme = {
  name: "Royal",
  backgroundClass: "bg-indigo-50",
  textClass: "text-zinc-900",
  accentClass: "text-indigo-700",
  ...base,

  palette: {
    background: "#eef2ff",
    foreground: "#0f172a",
    accent: "#4338ca",
    muted: "#475569",
  },

  gradient: { enabled: false, direction: "left-right", from: "#eef2ff", to: "#e0e7ff" },
  overlay: { enabled: false, color: "#000000", opacity: 0.35 },

  ...baseRules,
}

export const minimalTheme: SlideTheme = {
  name: "Minimal",
  backgroundClass: "bg-white",
  textClass: "text-zinc-950",
  accentClass: "text-zinc-900",
  ...base,

  palette: {
    background: "#ffffff",
    foreground: "#0a0a0a",
    accent: "#111111",
    muted: "#52525b",
  },

  gradient: { enabled: false, direction: "top-bottom", from: "#ffffff", to: "#ffffff" },
  overlay: { enabled: false, color: "#000000", opacity: 0.35 },

  ...baseRules,
}

export const slideThemes: SlideTheme[] = [
  defaultTheme,
  darkTheme,
  minimalTheme,
  royalTheme,
  forestTheme,
  sunsetTheme,
]

export function getThemeByName(name?: string): SlideTheme {
  return slideThemes.find((t) => t.name === name) ?? defaultTheme
}
