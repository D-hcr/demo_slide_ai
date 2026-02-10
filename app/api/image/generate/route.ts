import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { prompt, seed, model } = body ?? {}

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
  }

  const cleanPrompt = prompt.trim()
  if (cleanPrompt.length < 3) {
    return NextResponse.json({ error: "Prompt too short" }, { status: 400 })
  }
  if (cleanPrompt.length > 600) {
    return NextResponse.json({ error: "Prompt too long" }, { status: 400 })
  }

  const s =
    typeof seed === "number"
      ? seed
      : typeof seed === "string"
        ? parseInt(seed, 10) || Math.floor(Math.random() * 1_000_000)
        : Math.floor(Math.random() * 1_000_000)

  const encoded = encodeURIComponent(cleanPrompt)

  // Pollinations cache kırma
  const v = Date.now()

  const modelParam =
    typeof model === "string" && model.trim().length > 0
      ? `&model=${encodeURIComponent(model.trim())}`
      : ""

  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${s}&v=${v}${modelParam}`

  return NextResponse.json({ imageUrl })
}
