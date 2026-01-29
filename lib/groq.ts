import OpenAI from "openai"
import { buildSlidePrompt, buildRegenerateSlideTextPrompt, buildRegenerateImagePrompt } from "@/lib/prompt"
import type { SlideDeck, Slide } from "@/types/slide"

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
})

export async function generateSlides(topic: string): Promise<SlideDeck> {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: "You are a strict JSON generator. Return ONLY valid JSON. No markdown.",
      },
      {
        role: "user",
        content: buildSlidePrompt(topic),
      },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error("Groq returned empty response")

  return JSON.parse(content) as SlideDeck
}

/* ======================= */
/* REGENERATE: SLIDE TEXT  */
/* ======================= */
export async function regenerateSlideText(slide: Slide): Promise<{
  title: string
  bullets: string[]
  notes?: string
}> {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.8,
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No markdown." },
      { role: "user", content: buildRegenerateSlideTextPrompt(slide) },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error("Groq returned empty response")

  return JSON.parse(content) as { title: string; bullets: string[]; notes?: string }
}

/* ======================= */
/* REGENERATE: IMAGE PROMPT */
/* ======================= */
export async function regenerateSlideImagePrompt(slide: Slide): Promise<{
  imagePrompt: string
}> {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.9,
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No markdown." },
      { role: "user", content: buildRegenerateImagePrompt(slide) },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error("Groq returned empty response")

  return JSON.parse(content) as { imagePrompt: string }
}

function extractJson(text: string) {
  // ```json ... ``` varsa
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) {
    return JSON.parse(fenced[1])
  }

  // metin içindeki ilk { ... } bloğu
  const a = text.indexOf("{")
  const b = text.lastIndexOf("}")
  if (a >= 0 && b > a) {
    return JSON.parse(text.slice(a, b + 1))
  }

  throw new Error("No JSON found in model output")
}

export async function runDeckLLM(prompt: string): Promise<any> {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a strict JSON generator. Return ONLY valid JSON. No markdown. No explanations.",
      },
      { role: "user", content: prompt },
    ],
  })

  const content = response.choices?.[0]?.message?.content
  if (!content) throw new Error("Groq returned empty response")

  // bazen model yanlışlıkla yazı ekler → yakala
  return extractJson(content)
}

