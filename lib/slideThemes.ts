import type { SlideTheme } from "@/types/slide"

const base = {
  titleSize: "text-4xl",
  bulletSize: "text-xl",
  fontFamily: "font-sans",
} as const

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

function makeTheme(t: SlideTheme): Readonly<SlideTheme> {
  // shallow freeze yeterli (nested objeler zaten literal + as const)
  return Object.freeze(t)
}

export const defaultTheme = makeTheme({
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

  // ✅ shared ref olmasın diye spread (defansif)
  imageStyle: { ...baseRules.imageStyle },
  exportRules: { ...baseRules.exportRules },
} satisfies SlideTheme)

export const darkTheme = makeTheme({
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

  imageStyle: { ...baseRules.imageStyle },
  exportRules: { ...baseRules.exportRules },
} satisfies SlideTheme)

export const sunsetTheme = makeTheme({
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

  imageStyle: { ...baseRules.imageStyle },
  exportRules: { ...baseRules.exportRules },
} satisfies SlideTheme)

export const forestTheme = makeTheme({
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

  imageStyle: { ...baseRules.imageStyle },
  exportRules: { ...baseRules.exportRules },
} satisfies SlideTheme)

export const royalTheme = makeTheme({
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

  imageStyle: { ...baseRules.imageStyle },
  exportRules: { ...baseRules.exportRules },
} satisfies SlideTheme)

export const minimalTheme = makeTheme({
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

  imageStyle: { ...baseRules.imageStyle },
  exportRules: { ...baseRules.exportRules },
} satisfies SlideTheme)

/** ✅ sabit sıra, sabit referans */
export const slideThemes = Object.freeze([
  defaultTheme,
  darkTheme,
  minimalTheme,
  royalTheme,
  forestTheme,
  sunsetTheme,
] as const)

/** ✅ toleranslı tema bulma (trim + case-insensitive) */
export function getThemeByName(name?: string): SlideTheme {
  const q = (name ?? "").trim().toLowerCase()
  if (!q) return defaultTheme
  return slideThemes.find((t) => t.name.toLowerCase() === q) ?? defaultTheme
}

/** ✅ DB / LLM’den gelen themeName’i güvenli hale getir */
export function resolveThemeName(name?: string): string {
  return getThemeByName(name).name
}

/**
 * ✅ Step 8 hazırlığı (deterministik):
 * konuya göre otomatik tema seçimi (istersen sonra AI ile geliştiririz)
 */
export function pickThemeForTopic(topic?: string): SlideTheme {
  const t = (topic ?? "").toLowerCase()

  if (/(finans|bank|yatırım|borsa|risk|compliance|kurumsal)/.test(t)) return royalTheme
  if (/(enerji|iklim|çevre|sürdürülebilir|yeşil|doğa)/.test(t)) return forestTheme
  if (/(tasarım|yaratıcı|pazarlama|marka|sunum|storytelling)/.test(t)) return sunsetTheme
  if (/(teknoloji|yapay zeka|ai|data|siber|cloud|saas)/.test(t)) return darkTheme

  return defaultTheme
}
