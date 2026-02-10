// lib/export/imageData.ts

export function getBaseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http"
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  return `${proto}://${host}`
}

function isHttpUrl(u: string) {
  return u.startsWith("http://") || u.startsWith("https://")
}

export async function toDataUri(req: Request, url: string, timeoutMs = 20_000) {
  if (!url) return ""
  if (url.startsWith("data:")) return url

  const abs = url.startsWith("/") ? `${getBaseUrl(req)}${url}` : url
  if (!isHttpUrl(abs)) return "" // ✅ file:, blob:, javascript: vs engelle

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(abs, { cache: "no-store", signal: controller.signal })
    clearTimeout(t)

    if (!res.ok) return ""

    const mime = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim()
    // ✅ sadece image/*
    if (!mime.startsWith("image/")) return ""

    const buf = Buffer.from(await res.arrayBuffer())
    const b64 = buf.toString("base64")
    return `data:${mime};base64,${b64}`
  } catch {
    return ""
  }
}
