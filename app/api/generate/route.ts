import { generateSlides } from "@/lib/groq"

export async function POST(req: Request) {
  const { topic } = await req.json()

  const slideDeck = await generateSlides(topic)

  return Response.json(slideDeck)
}
