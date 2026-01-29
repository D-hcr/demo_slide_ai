"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type SlideImageProps = {
  imagePrompt: string
  imageUrl?: string
  onGenerated?: (url: string) => void
  enableAI?: boolean
  seed?: number | string
}

async function preload(url: string) {
  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("Image failed to load"))
    img.src = url
  })
}

export function SlideImage({
  imagePrompt,
  imageUrl,
  onGenerated,
  enableAI = true,
  seed,
}: SlideImageProps) {
  const [loading, setLoading] = useState(false)
  const [localImageUrl, setLocalImageUrl] = useState<string | undefined>(imageUrl)

  const hasGeneratedRef = useRef(false)
  const lastPromptRef = useRef<string>("")

  // Parent'tan imageUrl gelirse sync
  useEffect(() => {
    if (imageUrl) setLocalImageUrl(imageUrl)
  }, [imageUrl])

  // Prompt değiştiyse yeniden üretime izin ver
  useEffect(() => {
    if (lastPromptRef.current && lastPromptRef.current !== imagePrompt) {
      hasGeneratedRef.current = false
      setLocalImageUrl(undefined)
    }
    lastPromptRef.current = imagePrompt
  }, [imagePrompt])

  const resolvedSeed = useMemo(() => {
    if (typeof seed === "number") return seed
    if (typeof seed === "string") {
      const n = parseInt(seed, 10)
      if (!Number.isNaN(n)) return n
    }
    // seed yoksa prompt hash
    let h = 0
    for (let i = 0; i < imagePrompt.length; i++) h = (h * 31 + imagePrompt.charCodeAt(i)) >>> 0
    return h
  }, [seed, imagePrompt])

  useEffect(() => {
    if (!enableAI) return
    if (!imagePrompt) return
    if (localImageUrl) return
    if (hasGeneratedRef.current) return

    hasGeneratedRef.current = true

    async function generateWithRetry() {
      setLoading(true)

      try {
        // 1. deneme
        const res1 = await fetch("/api/image/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: imagePrompt,
            seed: resolvedSeed,
            // model: "flux", // istersen aç (desteklenirse)
          }),
        })
        if (!res1.ok) throw new Error("Image generation failed")
        const data1 = await res1.json()

        // Görsel gerçekten yükleniyor mu? (bazı placeholder/bozuk url'lerde yakalar)
        await preload(data1.imageUrl)

        setLocalImageUrl(data1.imageUrl)
        onGenerated?.(data1.imageUrl)
      } catch (e1) {
        // 2. deneme (seed’i kaydır)
        try {
          const res2 = await fetch("/api/image/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: imagePrompt,
              seed: Number(resolvedSeed) + 99991,
            }),
          })
          if (!res2.ok) throw new Error("Retry image generation failed")
          const data2 = await res2.json()

          await preload(data2.imageUrl)

          setLocalImageUrl(data2.imageUrl)
          onGenerated?.(data2.imageUrl)
        } catch (e2) {
          console.error("Image generate error:", e1, e2)
          hasGeneratedRef.current = false
        }
      } finally {
        setLoading(false)
      }
    }

    generateWithRetry()
  }, [enableAI, imagePrompt, localImageUrl, onGenerated, resolvedSeed])

  if (loading) {
    return <div className="mt-4 h-40 w-full animate-pulse rounded-xl bg-gray-200" />
  }

  if (!localImageUrl) {
    return (
      <div className="mt-4 h-40 w-full rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400">
        Görsel henüz oluşturulmadı
      </div>
    )
  }

  return (
    <img
      src={localImageUrl}
      alt="Slide visual"
      className="mt-4 w-full rounded-xl object-cover shadow-md transition"
    />
  )
}
