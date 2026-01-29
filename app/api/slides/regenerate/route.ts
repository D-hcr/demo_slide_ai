import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { regenerateSlideText, regenerateSlideImagePrompt } from "@/lib/groq"
import type { Slide } from "@/types/slide"

type Body =
  | { mode: "text"; slide: Slide }
  | { mode: "imagePrompt"; slide: Slide }

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body?.slide || typeof body.slide !== "object") {
    return NextResponse.json({ error: "Missing slide" }, { status: 400 })
  }

  if (body.mode === "text") {
    const out = await regenerateSlideText(body.slide)
    return NextResponse.json(out) // { title, bullets, notes? }
  }

  if (body.mode === "imagePrompt") {
    const out = await regenerateSlideImagePrompt(body.slide)
    return NextResponse.json(out) // { imagePrompt }
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
}
