// /home/hacer/Desktop/slied_project/slide-ai/lib/groq.ts
import OpenAI from "openai"
import { buildSlidePrompt, buildRegenerateSlideTextPrompt, buildRegenerateImagePrompt } from "@/lib/prompt"
import type { SlideDeck, Slide, DeckMeta } from "@/types/slide"

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
})

function metaContext(meta?: DeckMeta) {
  const t = meta?.topic?.trim()
  const a = meta?.audience?.trim()
  const tone = meta?.tone?.trim()

  if (!t && !a && !tone) return ""

  return [
    "CONTEXT (Presentation Meta):",
    t ? `- Topic: ${t}` : null,
    a ? `- Audience: ${a}` : null,
    tone ? `- Tone: ${tone}` : null,
    "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function generateSlides(topic: string, meta?: DeckMeta): Promise<SlideDeck> {
  const fullTopic = metaContext({ ...meta, topic: meta?.topic?.trim() || topic }) + buildSlidePrompt(topic)

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    messages: [
      { role: "system", content: "You are a strict JSON generator. Return ONLY valid JSON. No markdown." },
      { role: "user", content: fullTopic },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error("Groq returned empty response")

  return JSON.parse(content) as SlideDeck
}

/* ======================= */
/* REGENERATE: SLIDE TEXT  */
/* ======================= */
export async function regenerateSlideText(
  slide: Slide,
  meta?: DeckMeta
): Promise<{ title: string; bullets: string[]; notes?: string }> {
  const prompt = metaContext(meta) + buildRegenerateSlideTextPrompt(slide)

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.8,
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No markdown." },
      { role: "user", content: prompt },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error("Groq returned empty response")

  return JSON.parse(content) as { title: string; bullets: string[]; notes?: string }
}

/* ======================= */
/* REGENERATE: IMAGE PROMPT */
/* ======================= */
export async function regenerateSlideImagePrompt(
  slide: Slide,
  meta?: DeckMeta
): Promise<{ imagePrompt: string }> {
  const prompt = metaContext(meta) + buildRegenerateImagePrompt(slide)

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.9,
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No markdown." },
      { role: "user", content: prompt },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error("Groq returned empty response")

  return JSON.parse(content) as { imagePrompt: string }
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) return JSON.parse(fenced[1])

  const a = text.indexOf("{")
  const b = text.lastIndexOf("}")
  if (a >= 0 && b > a) return JSON.parse(text.slice(a, b + 1))

  throw new Error("No JSON found in model output")
}

export async function runDeckLLM(prompt: string): Promise<any> {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "You are a strict JSON generator. Return ONLY valid JSON. No markdown. No explanations.",
      },
      { role: "user", content: prompt },
    ],
  })

  const content = response.choices?.[0]?.message?.content
  if (!content) throw new Error("Groq returned empty response")
  return extractJson(content)
}
