"use client"

import type { Slide, SlideTheme } from "@/types/slide"
import { SlideImage } from "./SlideImage"

export default function ActiveSlideView({
  slide,
  theme,
  onChange,
}: {
  slide: Slide
  theme: SlideTheme
  onChange: (updated: Slide) => void
}) {
  const layout = slide.layout ?? "text-left"

  const content = (
    <div className="flex flex-1 gap-8">
      {/* IMAGE LEFT */}
      {layout === "image-left" && slide.imagePrompt && (
        <div className="w-[42%] flex items-center">
          <SlideImage
            imagePrompt={slide.imagePrompt}
            imageUrl={slide.imageUrl}
            seed={slide.id}
            onGenerated={(url) => onChange({ ...slide, imageUrl: url })}
          />
        </div>
      )}

      {/* BULLETS */}
      <ul
        className={`
          list-disc pl-6 space-y-4 flex-1
          ${theme.bulletSize}
        `}
      >
        {(slide.bullets ?? []).map((b, i) => (
          <li key={i}>{b || "Bullet text"}</li>
        ))}
      </ul>

      {/* IMAGE RIGHT */}
      {layout === "text-left" && slide.imagePrompt && (
        <div className="w-[42%] flex items-center">
          <SlideImage
            imagePrompt={slide.imagePrompt}
            imageUrl={slide.imageUrl}
            seed={slide.id}
            onGenerated={(url) => onChange({ ...slide, imageUrl: url })}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-1 justify-center items-start bg-zinc-900 p-8 overflow-auto">
      <div
        className={`
          relative w-[960px] aspect-video bg-white rounded-sm
          shadow-[0_20px_60px_rgba(0,0,0,0.6)]
          px-16 py-14 flex flex-col
          ${theme.text} ${theme.fontFamily}
        `}
      >
        {/* FULL IMAGE LAYOUT */}
        {layout === "full-image" && slide.imagePrompt ? (
          <div className="relative flex-1">
            <div className="absolute inset-0 rounded-sm overflow-hidden">
              <SlideImage
                imagePrompt={slide.imagePrompt}
                imageUrl={slide.imageUrl}
                seed={slide.id}
                onGenerated={(url) => onChange({ ...slide, imageUrl: url })}
              />
            </div>

            <div className="relative z-10 mt-2 max-w-[70%] rounded-xl bg-white/80 p-6 backdrop-blur">
              <h1 className={`${theme.titleSize} font-bold mb-4`}>
                {slide.title || "Slide Title"}
              </h1>
              <ul className={`list-disc pl-6 space-y-2 ${theme.bulletSize}`}>
                {(slide.bullets ?? []).map((b, i) => (
                  <li key={i}>{b || "Bullet text"}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <h1 className={`${theme.titleSize} font-bold mb-10`}>
              {slide.title || "Slide Title"}
            </h1>
            {content}
          </>
        )}

        <div className="absolute bottom-4 right-6 text-xs opacity-40">Slide AI</div>
      </div>
    </div>
  )
}
