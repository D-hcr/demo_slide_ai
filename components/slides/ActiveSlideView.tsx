"use client"

import type { Slide, SlideTheme } from "@/types/slide"
import { SlideImage } from "./SlideImage"

function buildBgStyle(theme: SlideTheme): React.CSSProperties {
  const g = theme.gradient
  if (g?.enabled) {
    const dir =
      g.direction === "top-bottom"
        ? "to bottom"
        : g.direction === "bottom-top"
          ? "to top"
          : g.direction === "left-right"
            ? "to right"
            : "to left"

    return {
      backgroundImage: `linear-gradient(${dir}, ${g.from}, ${g.to})`,
      color: theme.palette.foreground,
    }
  }

  return {
    backgroundColor: theme.palette.background,
    color: theme.palette.foreground,
  }
}

function normalizeLayout(slide: Slide): Slide["layout"] {
  const layout = slide.layout ?? "text-left"
  const hasImage = !!(slide.imagePrompt && slide.imagePrompt.trim())

  // ✅ Step 8: full-image ama image yoksa UI kırılmasın
  if (layout === "full-image" && !hasImage) return "text-left"
  return layout
}

export default function ActiveSlideView({
  slide,
  theme,
  onChange,
}: {
  slide: Slide
  theme: SlideTheme
  onChange: (updated: Slide) => void
}) {
  const layout = normalizeLayout(slide)
  const hasImage = !!(slide.imagePrompt && slide.imagePrompt.trim())

  // ActiveSlideView.tsx içinde ImageBlock'ı bununla değiştir
const ImageBlock =
  layout === "full-image" ? null : (
    <div className="w-[44%]">
      <div
        className="h-full overflow-hidden border"
        style={{
          borderRadius: theme.imageStyle?.radius ?? 20,
          borderColor: "rgba(0,0,0,0.10)",
          background: "rgba(0,0,0,0.05)",
        }}
      >
        {hasImage ? (
          <div className="h-full p-3">
            <div className="aspect-video w-full">
              <SlideImage
                imagePrompt={slide.imagePrompt}
                imageUrl={slide.imageUrl}
                seed={slide.id}
                onGenerated={(url) => onChange({ ...slide, imageUrl: url })}
                className="object-cover" // UI'da güzel dursun
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center">
            ...
          </div>
        )}
      </div>
    </div>
  )

  const TextBlock = (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-[10px] w-14 rounded-full" style={{ background: theme.palette.accent }} />
        <div className="text-xs opacity-50">Slide AI</div>
      </div>

      <h1 className={`${theme.titleSize} font-extrabold leading-[1.08] mb-6 break-words`}>
        {slide.title || "Slide Title"}
      </h1>

      <ul className={`list-disc pl-6 space-y-3 ${theme.bulletSize}`}>
        {(slide.bullets ?? []).map((b, i) => (
          <li key={i} className="break-words">
            {b || "Bullet text"}
          </li>
        ))}
      </ul>
    </div>
  )

  const shellStyle = buildBgStyle(theme)

  return (
    <div className="flex flex-1 justify-center items-start bg-zinc-900 p-8 overflow-auto">
      <div
        className={`
          relative w-[1040px] aspect-video rounded-2xl
          shadow-[0_30px_90px_rgba(0,0,0,0.55)]
          overflow-hidden
          ${theme.fontFamily}
        `}
        style={shellStyle}
      >
        {/* FULL IMAGE */}
        {layout === "full-image" && hasImage ? (
          <div className="relative w-full h-full">
            <div className="absolute inset-0">
              <SlideImage
                imagePrompt={slide.imagePrompt}
                imageUrl={slide.imageUrl}
                seed={slide.id}
                onGenerated={(url) => onChange({ ...slide, imageUrl: url })}
              />

              {/* ✅ overlay (isteğe bağlı) */}
              {theme.overlay?.enabled ? (
                <div
                  className="absolute inset-0"
                  style={{
                    background: theme.overlay.color,
                    opacity: theme.overlay.opacity,
                  }}
                />
              ) : null}
            </div>

            <div className="relative z-10 p-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-[10px] w-14 rounded-full bg-white/85" />
                <div className="text-xs text-white/70">Slide AI</div>
              </div>

              <div className="max-w-[72%] rounded-2xl bg-white/85 backdrop-blur p-8">
                <h1 className="text-4xl font-extrabold mb-4 text-zinc-900 leading-[1.08]">
                  {slide.title || "Slide Title"}
                </h1>
                <ul className="list-disc pl-6 space-y-2 text-lg text-zinc-900">
                  {(slide.bullets ?? []).map((b, i) => (
                    <li key={i}>{b || "Bullet text"}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          // STANDARD
          <div className="h-full p-14">
            <div className="flex h-full gap-10">
              {layout === "image-left" ? (
                <>
                  {ImageBlock}
                  {TextBlock}
                </>
              ) : (
                <>
                  {TextBlock}
                  {ImageBlock}
                </>
              )}
            </div>
          </div>
        )}

        <div className="absolute bottom-5 right-7 text-xs opacity-40">Slide AI</div>
      </div>
    </div>
  )
}
