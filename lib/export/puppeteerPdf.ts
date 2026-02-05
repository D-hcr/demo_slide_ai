// lib/export/puppeteerPdf.ts

import puppeteer from "puppeteer"

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

async function waitForImages(page: any, timeoutMs = 20_000) {
  try {
    await page.waitForFunction(() => {
      const imgs = Array.from(document.images || []) as HTMLImageElement[]
      // imageUrl boş olabilir, sadece src olanları kontrol edelim
      const withSrc = imgs.filter((img) => !!img.getAttribute("src"))
      return withSrc.every((img) => img.complete && img.naturalWidth > 0)
    }, { timeout: timeoutMs })
  } catch {
    // ignore (image provider bazen gecikebiliyor)
  }
}

export async function renderHtmlToPdfBuffer(html: string) {
  let browser: any = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ],
    })

    const page = await browser.newPage()
    await page.emulateMediaType("print")
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })
    page.setDefaultNavigationTimeout(60_000)
    page.setDefaultTimeout(60_000)

    await page.setContent(html, { waitUntil: "networkidle2" })

    await waitForFonts(page)
    await waitForImages(page)

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
