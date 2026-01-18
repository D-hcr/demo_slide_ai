import type { SlideDeck } from "@/types/slide"
import { SlideCard } from "./SlideCard"

export function SlideDeckView({ deck }: { deck: SlideDeck }) {
  return (
    <div className="space-y-10">
      
      <div className="text-center">
        <h1 className="text-3xl font-bold">{deck.title}</h1>
        {deck.description && (
          <p className="text-gray-600 mt-2">
            {deck.description}
          </p>
        )}
      </div>

      <div className="space-y-8">
        {deck.slides.map((slide) => (
          <SlideCard key={slide.id} slide={slide} />
        ))}
      </div>
    </div>
  )
}
