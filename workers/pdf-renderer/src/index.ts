import puppeteer from "@cloudflare/puppeteer"

export interface Env {
  // Cloudflare Browser Rendering binding
  BROWSER: any
}

async function waitForFonts(page: any) {
  try {
    await page.evaluate(async () => {
      // @ts-ignore
      if (document.fonts && document.fonts.ready) {
        // @ts-ignore
        await document.fonts.ready
      }
    })
  } catch {}
}

async function waitForImages(page: any, timeoutMs = 30_000) {
  try {
    await page.waitForFunction(
      () => {
        const imgs = Array.from(document.images || []) as HTMLImageElement[]
        const withSrc = imgs.filter((img) => !!img.getAttribute("src"))
        return withSrc.every((img) => img.complete && img.naturalWidth > 0)
      },
      { timeout: timeoutMs }
    )
  } catch {}
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 })
    }

    const ct = req.headers.get("content-type") || ""
    if (!ct.includes("application/json")) {
      return new Response("Invalid content-type", { status: 400 })
    }

    const body = await req.json().catch(() => null)
    const html = typeof body?.html === "string" ? body.html : ""
    if (!html.trim()) {
      return new Response("Missing html", { status: 400 })
    }

    const browser = await puppeteer.launch(env.BROWSER)

    try {
      const page = await browser.newPage()
      await page.emulateMediaType("print")

      page.setDefaultNavigationTimeout(120_000)
      page.setDefaultTimeout(120_000)

      await page.setContent(html, { waitUntil: "domcontentloaded" })
      await waitForFonts(page)
      await waitForImages(page, 30_000)

      const pdf = await page.pdf({
        width: "1280px",
        height: "720px",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      })

      // pdf: Uint8Array / ArrayBuffer gibi gelir → Response bunu direkt kabul eder
      return new Response(pdf as any, {
        headers: {
          "content-type": "application/pdf",
          "cache-control": "no-store",
        },
      })
    } finally {
      try {
        await browser.close()
      } catch {}
    }
  },
}
