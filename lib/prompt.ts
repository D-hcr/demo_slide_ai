// lib/prompt.ts
export const buildSlidePrompt = (topic: string) => `
You are an AI that generates presentation slides.

Rules:
- Output ONLY valid JSON
- Do NOT include markdown
- Do NOT include explanations
- Language: Turkish
- Style: concise, clear, professional
- Image prompts must describe a clean, modern, flat illustration style

JSON format:
{
  "title": string,
  "description": string,
  "slides": [
    {
      "id": number,
      "title": string,
      "bullets": string[],
      "imagePrompt": string,
      "notes": string
    }
  ]
}

Topic:
"${topic}"

Slide requirements:
- 6 to 8 slides
- Each slide must have 3–5 bullet points
- imagePrompt should visually represent the slide topic
- notes should briefly explain the slide for the presenter
`
