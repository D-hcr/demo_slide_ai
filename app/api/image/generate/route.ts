import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt, seed, model } = await req.json()

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
  }

  const s =
    typeof seed === "number"
      ? seed
      : typeof seed === "string"
      ? parseInt(seed, 10) || Math.floor(Math.random() * 1_000_000)
      : Math.floor(Math.random() * 1_000_000)

  const encoded = encodeURIComponent(prompt)

  // Not: Pollinations tarafı bazen cache/placeholder döndürebiliyor.
  // v parametresi cache'i kırıyor. retry UI tarafında yapılacak.
  const v = Date.now()

  // model opsiyonel (desteklenmiyorsa görmezden gelebilir)
  const modelParam =
    typeof model === "string" && model.trim().length > 0
      ? `&model=${encodeURIComponent(model.trim())}`
      : ""

  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${s}&v=${v}${modelParam}`

  return NextResponse.json({ imageUrl })
}
