// /home/hacer/Desktop/slied_project/slide-ai/lib/deckChat.ts
import type { SlideDeck as AppDeck, Slide as AppSlide, DeckMeta } from "@/types/slide"
import { runDeckLLM } from "@/lib/groq"

type Role = "user" | "assistant" | "system"
type ChatMsg = { role: Role; content: string }

type RunArgs = {
  userText: string
  deck: AppDeck
  messages: Array<{ role: string; content: string }>
}

type RunResult = {
  assistantText: string
  updatedDeck?: AppDeck | null
}

function metaLine(meta?: DeckMeta) {
  const t = meta?.topic?.trim()
  const a = meta?.audience?.trim()
  const tone = meta?.tone?.trim()
  if (!t && !a && !tone) return ""
  return [
    "META:",
    t ? `- Topic: ${t}` : null,
    a ? `- Audience: ${a}` : null,
    tone ? `- Tone: ${tone}` : null,
    "",
  ]
    .filter(Boolean)
    .join("\n")
}

/** ✅ Basit komut çözümleyici (LLM JSON vermezse bile çalışır) */
function parseSimpleCommand(text: string) {
  const t = (text || "").toLowerCase()

  let slideNo: number | null = null
  const m1 = t.match(/(\d+)\s*\.?\s*slayt/)
  const m2 = t.match(/slayt\s*(\d+)/)
  if (m1) slideNo = Number(m1[1])
  else if (m2) slideNo = Number(m2[1])

  const wantsDelete = /\b(sil|kaldır|çıkar|remove|delete)\b/.test(t)
  const wantsUpdate = /\b(güncelle|guncelle|değiştir|degistir|yenile|update)\b/.test(t)
  const wantsAllTitles =
    (/\b(tüm|tum|butun|bütün)\b/.test(t) && /\b(başlık|baslik)\b/.test(t)) ||
    /\bbaşlıkları güncelle\b/.test(t) ||
    /\bbasliklari guncelle\b/.test(t)

  return { slideNo, wantsDelete, wantsUpdate, wantsAllTitles }
}

function getDeckTopic(deck: AppDeck) {
  // ✅ meta.topic varsa onu baz al
  const metaTopic = deck.meta?.topic?.trim()
  if (metaTopic) return metaTopic.slice(0, 220)

  const base = deck.title?.trim() || "Sunum"
  const s1 = deck.slides?.[0]?.title ? ` / ${deck.slides[0].title}` : ""
  const s2 = deck.slides?.[1]?.title ? ` / ${deck.slides[1].title}` : ""
  return `${base}${s1}${s2}`.slice(0, 220)
}

function clampBullets(arr: any) {
  const bullets = Array.isArray(arr)
    ? arr.map((x) => String(x ?? "")).filter((x) => x.trim())
    : []
  return bullets.slice(0, 6)
}

/** ✅ id her zaman string */
function normalizeId(id: any, fallback: string) {
  if (typeof id === "string" && id.trim()) return id.trim()
  if (typeof id === "number" && Number.isFinite(id)) return String(id)
  return fallback
}

function normalizeSlideLike(s: any, fallbackId: string): AppSlide {
  const id = normalizeId(s?.id, fallbackId)

  const layout =
    s?.layout === "text-left" || s?.layout === "image-left" || s?.layout === "full-image"
      ? s.layout
      : undefined

  return {
    id,
    title: typeof s?.title === "string" && s.title.trim() ? s.title : "Başlıksız",
    bullets: clampBullets(s?.bullets),
    imagePrompt: typeof s?.imagePrompt === "string" ? s.imagePrompt : "",
    imageUrl: typeof s?.imageUrl === "string" ? s.imageUrl : undefined,
    layout,
    style: typeof s?.style === "object" && s?.style ? s.style : undefined,
    notes: typeof s?.notes === "string" ? s.notes : undefined,
  }
}

async function callModelJSON(prompt: string): Promise<any> {
  return runDeckLLM(prompt)
}

function extractLikelyJson(text: string) {
  const t = (text ?? "").trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence?.[1]) return fence[1].trim()

  const i = t.indexOf("{")
  const j = t.lastIndexOf("}")
  if (i >= 0 && j > i) return t.slice(i, j + 1)
  return t
}

async function callModelJSONSafe(prompt: string): Promise<any> {
  const out = await callModelJSON(prompt)
  if (out && typeof out === "object") return out
  if (typeof out === "string") {
    const jsonText = extractLikelyJson(out)
    return JSON.parse(jsonText)
  }
  return out
}

export async function runDeckChatCommand(args: RunArgs): Promise<RunResult> {
  const { userText, deck, messages } = args

  const safeDeck: AppDeck = {
    ...deck,
    slides: Array.isArray(deck.slides) ? deck.slides : [],
    meta: deck.meta,
  }

  const simple = parseSimpleCommand(userText)
  const topic = getDeckTopic(safeDeck)
  const metaCtx = metaLine(safeDeck.meta)

  // 1) Silme: deterministik
  if (simple.slideNo && simple.wantsDelete) {
    const idx = simple.slideNo - 1
    if (idx >= 0 && idx < safeDeck.slides.length) {
      const nextSlides = safeDeck.slides.filter((_, i) => i !== idx)
      return {
        assistantText: `${simple.slideNo}. slaytı sildim.`,
        updatedDeck: { ...safeDeck, slides: nextSlides },
      }
    }
    return {
      assistantText: `Silmek istediğin slayt bulunamadı (slayt: ${simple.slideNo}).`,
      updatedDeck: null,
    }
  }

  // 2) Tüm başlıkları güncelle
  if (simple.wantsAllTitles) {
    try {
      const prompt = `
Sen bir sunum düzenleyicisisin.

${metaCtx}
KONU: ${topic}

MEVCUT SLAYTLAR:
${JSON.stringify(safeDeck.slides)}

GÖREV:
- TÜM slaytların SADECE "title" alanını güncelle (bullets/imagePrompt/imageUrl/layout/notes aynı kalsın)
- Başlıklar birbirinden farklı olsun
- Türkçe ve kurumsal ton
- id'ler AYNI kalsın (string)

SADECE JSON döndür:
{
  "assistantText": "kısa açıklama",
  "updatedDeck": {
    "slides": [
      { "id": "string", "title": "string" }
    ]
  }
}
`.trim()

      const out = await callModelJSONSafe(prompt)

      if (out?.updatedDeck?.slides && Array.isArray(out.updatedDeck.slides)) {
        const byId = new Map(safeDeck.slides.map((s) => [s.id, s]))

        const slides = out.updatedDeck.slides.map((s: any, i: number) => {
          const incomingId = normalizeId(s?.id, safeDeck.slides[i]?.id ?? `s-${i}`)
          const old = byId.get(incomingId) ?? safeDeck.slides[i]
          const merged = { ...old, title: typeof s?.title === "string" ? s.title : old.title, id: old?.id ?? incomingId }
          return normalizeSlideLike(merged, old?.id ?? incomingId)
        })

        return {
          assistantText: out?.assistantText || "Tüm slayt başlıklarını güncelledim.",
          updatedDeck: { ...safeDeck, slides },
        }
      }
    } catch {
      // ignore
    }

    const base = safeDeck.title?.trim() || "Sunum"
    const slides = safeDeck.slides.map((s, i) => ({ ...s, title: `${base}: Bölüm ${i + 1}` }))
    return { assistantText: "Tüm slayt başlıklarını güncelledim. (fallback)", updatedDeck: { ...safeDeck, slides } }
  }

  // 3) X. slaytı güncelle
  if (simple.slideNo && simple.wantsUpdate) {
    const idx = simple.slideNo - 1
    if (idx < 0 || idx >= safeDeck.slides.length) {
      return { assistantText: `Slayt bulunamadı (slayt: ${simple.slideNo}).`, updatedDeck: null }
    }

    const target = safeDeck.slides[idx]

    try {
      const prompt = `
Sen bir sunum düzenleyicisisin.

${metaCtx}
KONU: ${topic}

HEDEF SLAYT (${simple.slideNo}.):
${JSON.stringify(target)}

KULLANICI KOMUTU:
"${userText}"

GÖREV:
- Bu slaytın "title" + "bullets" + "imagePrompt" (gerekirse "notes") alanlarını güncelle
- 3-5 bullet
- Türkçe kurumsal ton
- id aynı kalmalı (string)

SADECE JSON döndür:
{
  "assistantText": "kısa açıklama",
  "updatedSlide": {
    "id": "string",
    "title": "string",
    "bullets": ["string"],
    "imagePrompt": "string",
    "notes": "string?"
  }
}
`.trim()

      const out = await callModelJSONSafe(prompt)

      if (out?.updatedSlide) {
        const updatedRaw = { ...target, ...out.updatedSlide, id: target.id }
        const updated = normalizeSlideLike(updatedRaw, target.id)
        const slides = safeDeck.slides.map((s, i) => (i === idx ? updated : s))

        return { assistantText: out?.assistantText || `${simple.slideNo}. slaytı güncelledim.`, updatedDeck: { ...safeDeck, slides } }
      }
    } catch {
      // ignore
    }

    const slides = safeDeck.slides.map((s, i) =>
      i !== idx
        ? s
        : {
            ...s,
            title: s.title?.trim() ? s.title : `Slayt ${simple.slideNo}`,
            bullets: Array.isArray(s.bullets) && s.bullets.length ? s.bullets : ["(İçerik güncellenecek)"],
          }
    )
    return { assistantText: `${simple.slideNo}. slaytı güncelledim. (fallback)`, updatedDeck: { ...safeDeck, slides } }
  }

  // 4) Genel: deck update dene
  try {
    const prompt = `
Sen bir sunum düzenleyicisisin.

${metaCtx}
KONU: ${topic}

MEVCUT DECK:
${JSON.stringify(safeDeck)}

SON MESAJLAR:
${JSON.stringify(messages)}

KULLANICI:
"${userText}"

KURAL:
- Kullanıcı değişiklik istiyorsa updatedDeck DÖN.
- id'ler AYNI kalsın (string)
- SADECE JSON döndür.

JSON:
{
  "assistantText": "kısa açıklama",
  "updatedDeck": {
    "title": "string?",
    "themeName": "string?",
    "meta": { "topic": "string?", "audience": "string?", "tone": "string?" },
    "slides": [
      {
        "id": "string",
        "title": "string",
        "bullets": ["string"],
        "imagePrompt": "string",
        "imageUrl": "string?",
        "layout": "text-left"|"image-left"|"full-image"?,
        "notes": "string?"
      }
    ]
  }
}
`.trim()

    const out = await callModelJSONSafe(prompt)

    if (out?.updatedDeck?.slides && Array.isArray(out.updatedDeck.slides)) {
      const byId = new Map(safeDeck.slides.map((s) => [s.id, s]))

      const slides = out.updatedDeck.slides.map((s: any, i: number) => {
        const incomingId = normalizeId(s?.id, safeDeck.slides[i]?.id ?? `s-${i}`)
        const old = byId.get(incomingId) ?? safeDeck.slides[i]
        const merged = { ...old, ...s, id: old?.id ?? incomingId }
        return normalizeSlideLike(merged, old?.id ?? incomingId)
      })

      return {
        assistantText: out?.assistantText || "Güncelledim.",
        updatedDeck: {
          ...safeDeck,
          title: out.updatedDeck.title ?? safeDeck.title,
          themeName: out.updatedDeck.themeName ?? safeDeck.themeName,
          meta: out.updatedDeck.meta ?? safeDeck.meta,
          slides,
        },
      }
    }

    return { assistantText: out?.assistantText || "Tamam.", updatedDeck: null }
  } catch {
    return { assistantText: "Komutu aldım ama deck güncellemesi üretilemedi. (LLM JSON çıktısı gelmedi)", updatedDeck: null }
  }
}
