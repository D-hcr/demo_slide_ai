// lib/export/imageData.ts
export function getBaseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http"
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  return `${proto}://${host}`
}

export async function toDataUri(req: Request, url: string) {
  if (!url) return ""
  if (url.startsWith("data:")) return url

  const abs = url.startsWith("/") ? `${getBaseUrl(req)}${url}` : url

  try {
    const res = await fetch(abs, { cache: "no-store" })
    if (!res.ok) return ""
    const mime = res.headers.get("content-type") ?? "image/png"
    const buf = Buffer.from(await res.arrayBuffer())
    const b64 = buf.toString("base64")
    return `data:${mime};base64,${b64}`
  } catch {
    return ""
  }
}
