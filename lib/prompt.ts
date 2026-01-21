// lib/prompt.ts

export const buildSlidePrompt = (topic: string) => `
You are an AI that generates presentation slide decks.

IMPORTANT:
- Output ONLY valid JSON
- Do NOT include markdown
- Do NOT include explanations or comments
- Language: Turkish
- Tone: clear, concise, professional
- Audience: business & technical presentations

JSON format (must match exactly):

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

Slide rules:
- 6 to 8 slides total
- IDs must start from 1 and increase sequentially
- Each slide must have 3 to 5 bullet points
- Bullet points must be short and presentation-ready
- imagePrompt must describe a clean, modern, flat illustration
- notes must briefly guide the presenter
- Do NOT return anything outside the JSON object
`
