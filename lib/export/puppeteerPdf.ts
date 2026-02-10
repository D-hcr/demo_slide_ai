// lib/export/puppeteerPdf.ts
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

async function waitForFonts(page: any) {
  try {
    await page.evaluate(async () => {
      // @ts-ignore
      if (document.fonts && document.fonts.ready) {
        // @ts-ignore
        await document.fonts.ready
      }
    })
  } catch {
    // ignore
  }
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
  } catch {
    // ignore (image provider gecikirse bloklama)
  }
}

async function resolveExecutablePath() {
  // Serverless/prod (Vercel vs)
  if (process.env.NODE_ENV === "production") {
    return await chromium.executablePath()
  }

  // Local dev: sistemde chromium/chrome varsa onu kullanmayı dene
  // (yoksa puppeteer-core path bulamaz; o durumda prod mantığına düşer)
  return (
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (await chromium.executablePath())
  )
}

export async function renderHtmlToPdfBuffer(html: string) {
  let browser: any = null

  try {
    const executablePath = await resolveExecutablePath()
    browser = await puppeteer.launch({
      headless: true, 
      executablePath,
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
    })

    const page = await browser.newPage()
    await page.emulateMediaType("print")

    // timeout artır (deploy’da görüntü embed/JSON işlemleri ağır olabiliyor)
    page.setDefaultNavigationTimeout(120_000)
    page.setDefaultTimeout(120_000)

    // networkidle2 deploy’da takılabiliyor -> domcontentloaded daha stabil
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

    return Buffer.from(pdf)
  } finally {
    try {
      if (browser) await browser.close()
    } catch {
      // ignore
    }
  }
}
