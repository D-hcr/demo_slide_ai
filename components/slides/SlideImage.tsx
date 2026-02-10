"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type SlideImageProps = {
  imagePrompt: string
  imageUrl?: string
  onGenerated?: (url: string) => void
  enableAI?: boolean
  seed?: number | string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// URL hemen hazır olmayabiliyor (CDN gecikmesi vs.)
async function waitForImage(url: string, tries = 6, delayMs = 350) {
  for (let i = 0; i < tries; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Image failed to load"))
        img.src = url
      })
      return true
    } catch {
      await sleep(delayMs)
    }
  }
  return false
}

function isAbortError(err: any) {
  return (
    err?.name === "AbortError" ||
    err?.code === "ABORT_ERR" ||
    String(err?.message ?? "").toLowerCase().includes("aborted")
  )
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

  const onGeneratedRef = useRef<typeof onGenerated>(onGenerated)
  useEffect(() => {
    onGeneratedRef.current = onGenerated
  }, [onGenerated])

  const lastPromptRef = useRef<string>("")
  const generatedKeyRef = useRef<string>("")

  // ✅ Parent'tan gelen imageUrl her değiştiğinde (undefined dahil) local'i sync et
  useEffect(() => {
    setLocalImageUrl(imageUrl)
  }, [imageUrl])

  // Prompt değiştiyse yeniden üretime izin ver + local görseli temizle
  useEffect(() => {
    const p = (imagePrompt ?? "").trim()
    if (lastPromptRef.current && lastPromptRef.current !== p) {
      generatedKeyRef.current = ""
      setLocalImageUrl(undefined)
    }
    lastPromptRef.current = p
  }, [imagePrompt])

  const resolvedSeed = useMemo(() => {
    if (typeof seed === "number") return seed
    if (typeof seed === "string") {
      const n = parseInt(seed, 10)
      if (!Number.isNaN(n)) return n
    }
    let h = 0
    for (let i = 0; i < imagePrompt.length; i++) h = (h * 31 + imagePrompt.charCodeAt(i)) >>> 0
    return h
  }, [seed, imagePrompt])

  useEffect(() => {
    if (!enableAI) return

    const prompt = (imagePrompt ?? "").trim()
    if (!prompt) return

    // local’de görsel varsa üretme
    if (localImageUrl) return

    const key = `${prompt}::${resolvedSeed}`
    if (generatedKeyRef.current === key) return
    generatedKeyRef.current = key

    const controller = new AbortController()
    let alive = true

    async function generateOnce(seedToUse: number) {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, seed: seedToUse }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Image generation failed")
      return res.json() as Promise<{ imageUrl: string }>
    }

    async function run() {
      setLoading(true)

      try {
        const data1 = await generateOnce(Number(resolvedSeed))

        if (!alive || controller.signal.aborted) return
        setLocalImageUrl(data1.imageUrl)
        onGeneratedRef.current?.(data1.imageUrl)

        await waitForImage(data1.imageUrl)
      } catch (e1: any) {
        // ✅ abort normal → sessiz çık
        if (isAbortError(e1) || controller.signal.aborted || !alive) return

        // ✅ sadece gerçek hatada retry
        try {
          const data2 = await generateOnce(Number(resolvedSeed) + 99991)

          if (!alive || controller.signal.aborted) return
          setLocalImageUrl(data2.imageUrl)
          onGeneratedRef.current?.(data2.imageUrl)

          await waitForImage(data2.imageUrl)
        } catch (e2: any) {
          if (isAbortError(e2) || controller.signal.aborted || !alive) return

          console.error("Image generate error:", e1, e2)
          generatedKeyRef.current = ""
        }
      } finally {
        if (alive && !controller.signal.aborted) setLoading(false)
      }
    }

    run()

    return () => {
      alive = false
      controller.abort()
    }
  }, [enableAI, imagePrompt, localImageUrl, resolvedSeed])

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
