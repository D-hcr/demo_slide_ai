import type { Slide } from "@/types/slide"

export function SlideCard({ slide }: { slide: Slide }) {
  return (
    <div className="w-full aspect-video rounded-xl border bg-white p-6 shadow-sm flex gap-6">
      
      {/* Sol */}
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-3">
          {slide.title}
        </h2>

        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          {slide.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </div>

      {/* Sağ */}
      <div className="w-1/3 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500 text-center px-2">
        {slide.imagePrompt}
      </div>
    </div>
  )
}
