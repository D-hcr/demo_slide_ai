import OpenAI from "openai"
import { buildSlidePrompt } from "@/lib/prompt"
import type { SlideDeck } from "@/types/slide"

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
        content:
          "You are a strict JSON generator. Return ONLY valid JSON. No markdown.",
      },
      {
        role: "user",
        content: buildSlidePrompt(topic),
      },
    ],
  })

  const content = response.choices[0].message.content

  if (!content) {
    throw new Error("Groq returned empty response")
  }

  return JSON.parse(content) as SlideDeck
}
