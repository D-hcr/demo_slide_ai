// app/api/generate/route.ts

import { generateSlides } from "@/lib/groq"

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid topic" }),
        { status: 400 }
      )
    }

    const slideDeck = await generateSlides(topic)

    return Response.json(slideDeck)
  } catch (error) {
    console.error("Generate error:", error)

    return new Response(
      JSON.stringify({ error: "Slide generation failed" }),
      { status: 500 }
    )
  }
}
