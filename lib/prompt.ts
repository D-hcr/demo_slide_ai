// /home/hacer/Desktop/slied_project/slide-ai/lib/prompt.ts
import type { Slide, DeckMeta } from "@/types/slide"

function clean(s?: string) {
  const t = typeof s === "string" ? s.trim() : ""
  return t.length ? t : ""
}

function buildMetaBlock(meta?: DeckMeta) {
  const topic = clean(meta?.topic)
  const audience = clean(meta?.audience)
  const tone = clean(meta?.tone)

  if (!topic && !audience && !tone) return ""

  return `
META CONTEXT:
${topic ? `- Topic: ${topic}` : ""}
${audience ? `- Audience: ${audience}` : ""}
${tone ? `- Tone: ${tone}` : ""}
`.trim()
}

export const buildSlidePrompt = (topic: string, meta?: DeckMeta) => {
  const metaBlock = buildMetaBlock({ ...meta, topic: clean(meta?.topic) || clean(topic) })
  const effectiveTopic = clean(meta?.topic) || clean(topic)

  return `
You are an AI presentation designer.

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- No explanations
- Language: Turkish
- Professional corporate tone
- Be consistent with the META CONTEXT

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

${metaBlock ? metaBlock + "\n" : ""}

TOPIC:
"${effectiveTopic}"

DESIGN RULES:
- 8 to 10 slides
- Modern, minimal, corporate style
- Alternate layouts between slides
- DO NOT generate slide IDs (server will handle IDs)

CONTENT RULES:
- Slide titles should be short and specific
- Bullets: 3 to 5 items per slide (except agenda/summary can be 4-6)
- No emojis
- Avoid repeating the same wording across slides

IMAGE PROMPT RULES:
- imagePrompt MUST be unique for every slide
- flat vector illustration, minimal, corporate, clean background
- no text, no watermark, no logos

RETURN ONLY JSON
`.trim()
}

export const buildRegenerateSlideTextPrompt = (slide: Slide, meta?: DeckMeta) => {
  const metaBlock = buildMetaBlock(meta)

  return `
You are an AI slide editor.

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- Language: Turkish
- Corporate tone
- Keep it short & slide-friendly
- Be consistent with the META CONTEXT

${metaBlock ? metaBlock + "\n" : ""}

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
- Keep language and style aligned with META (audience/tone/topic)

RETURN JSON EXACTLY:
{
  "title": string,
  "bullets": string[],
  "notes": string
}
`.trim()
}

export const buildRegenerateImagePrompt = (slide: Slide, meta?: DeckMeta) => {
  const metaBlock = buildMetaBlock(meta)

  return `
You are an AI image prompt engineer for slide illustrations.

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- Language: English (ONLY for prompt quality)
- Prompt must be UNIQUE for this slide
- Be consistent with the META CONTEXT

${metaBlock ? metaBlock + "\n" : ""}

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
`.trim()
}
