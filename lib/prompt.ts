import type { Slide } from "@/types/slide"
export const buildSlidePrompt = (topic: string) => `
You are an AI presentation designer.

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- No explanations
- Language: Turkish
- Professional corporate tone

JSON FORMAT (must match exactly):

{
  "title": string,
  "description": string,
  "themeName": string,
  "slides": [
    {
      "title": string,
      "bullets": string[],
      "layout": "text-left" | "image-left" | "full-image",
      "imagePrompt": string,
      "notes": string
    }
  ]
}

TOPIC:
"${topic}"

DESIGN RULES:
- 8 to 10 slides
- Modern, minimal, corporate style
- Alternate layouts between slides
- DO NOT generate slide IDs (server will handle IDs)

IMAGE PROMPT RULES:
- imagePrompt MUST be unique for every slide
- flat vector illustration, minimal, corporate, no text, no watermark

RETURN ONLY JSON
`

export const buildRegenerateSlideTextPrompt = (slide: Slide) => `
You are an AI slide editor.

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- Language: Turkish
- Corporate tone
- Keep it short & slide-friendly

INPUT SLIDE (current):
Title: ${JSON.stringify(slide.title ?? "")}
Bullets: ${JSON.stringify(slide.bullets ?? [])}
Notes: ${JSON.stringify(slide.notes ?? "")}
Layout: ${JSON.stringify(slide.layout ?? "text-left")}
ImagePrompt: ${JSON.stringify(slide.imagePrompt ?? "")}

TASK:
- Improve/refresh title and bullets without changing the meaning too much
- 3 to 5 bullets
- No emojis
- Avoid repeating the same wording in bullets
- Make bullets more concrete (use nouns/verbs)

RETURN JSON EXACTLY:
{
  "title": string,
  "bullets": string[],
  "notes": string
}
`

export const buildRegenerateImagePrompt = (slide: Slide) => `
You are an AI image prompt engineer for slide illustrations.

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- Language: English (ONLY for prompt quality)
- Prompt must be UNIQUE for this slide

SLIDE CONTEXT:
Title: ${JSON.stringify(slide.title ?? "")}
Bullets: ${JSON.stringify(slide.bullets ?? [])}

TASK:
Create a new UNIQUE imagePrompt for this slide.
It must include:
- 2-4 concrete nouns from the title/bullets
- a distinct scene/object set (different from generic)
- style: "flat vector illustration, minimal, corporate, clean background, no text, no watermark"

Do NOT include:
- any text inside image
- logos/watermarks

RETURN JSON EXACTLY:
{
  "imagePrompt": string
}
`
