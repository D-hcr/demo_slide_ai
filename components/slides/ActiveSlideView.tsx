"use client"

import type { Slide, SlideTheme } from "@/types/slide"

export default function ActiveSlideView({
  slide,
  theme,
}: {
  slide: Slide
  theme: SlideTheme
}) {
  return (
    <div className="flex justify-center items-start flex-1 bg-zinc-950 p-6 overflow-auto">
      {/* SLIDE CANVAS */}
      <div
        className={`
          w-[960px]
          aspect-video
          rounded-lg
          shadow-2xl
          p-12
          flex
          flex-col
          ${theme.background}
          ${theme.text}
          ${theme.fontFamily}
        `}
      >
        {/* TITLE */}
        <h1 className={`${theme.titleSize} font-bold mb-8`}>
          {slide.title || "Slide Title"}
        </h1>

        {/* BULLETS */}
        <ul
          className={`
            list-disc
            pl-6
            space-y-4
            flex-1
            ${theme.bulletSize}
          `}
        >
          {slide.bullets.map((b, i) => (
            <li key={i}>{b || "Bullet text"}</li>
          ))}
        </ul>

        {/* FOOTER / IMAGE PROMPT */}
        {slide.imagePrompt && (
          <div className="mt-8 pt-4 border-t border-zinc-200 text-sm opacity-70">
            <strong>Image prompt:</strong>
            <p>{slide.imagePrompt}</p>
          </div>
        )}
      </div>
    </div>
  )
}