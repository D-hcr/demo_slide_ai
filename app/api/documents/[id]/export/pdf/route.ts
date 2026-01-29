import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import puppeteer from "puppeteer"
import { getThemeByName } from "@/lib/slideThemes"

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // content: Slide[] şeklinde saklıyoruz
  const rawContent = doc.content as any
  const slides = Array.isArray(rawContent) ? rawContent : rawContent?.slides ?? []

  const theme = getThemeByName(doc.themeName ?? "Default")

  // NOTE:
  // - A4 gibi istemiyoruz, 1280x720 kullanıyoruz
  // - Her slide "page-break-after: always" ile 1 sayfa
  // - Görsel dahil etmek için img'leri bekletiyoruz (networkidle0 + setContent)
  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: 1280px 720px; margin: 0; }
        html, body { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; }

        .slide {
          width: 1280px;
          height: 720px;
          box-sizing: border-box;
          padding: 80px;
          position: relative;
          page-break-after: always;
          background: ${theme.exportBackground};
          color: ${theme.exportText};
        }

        .title {
          font-size: 56px;
          font-weight: 700;
          margin: 0 0 24px 0;
          line-height: 1.1;
        }

        .contentRow {
          display: flex;
          gap: 48px;
          height: calc(720px - 80px - 80px - 56px - 24px);
        }

        .bullets {
          flex: 1;
          font-size: 30px;
          line-height: 1.35;
          margin: 0;
          padding-left: 28px;
        }

        .imageBox {
          width: 38%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 18px;
        }

        /* Layout: full-image */
        .fullImage {
          padding: 0;
        }
        .fullImage .bgImg {
          position: absolute;
          inset: 0;
          width: 1280px;
          height: 720px;
          object-fit: cover;
        }
        .fullImage .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
        }
        .fullImage .inner {
          position: relative;
          padding: 80px;
          height: 720px;
          box-sizing: border-box;
        }
        .fullImage .title,
        .fullImage .bullets {
          color: #fff;
        }

        .footer {
          position: absolute;
          bottom: 18px;
          right: 24px;
          font-size: 12px;
          opacity: 0.35;
        }
      </style>
    </head>

    <body>
      ${slides
        .map((s: any) => {
          const title = escapeHtml(s.title ?? "")
          const bullets = Array.isArray(s.bullets) ? s.bullets : []
          const imageUrl = typeof s.imageUrl === "string" ? s.imageUrl : ""
          const layout = (s.layout as string) || "text-left"

          // FULL IMAGE
          if (layout === "full-image" && imageUrl) {
            return `
              <section class="slide fullImage">
                <img class="bgImg" src="${imageUrl}" />
                <div class="overlay"></div>
                <div class="inner">
                  <h1 class="title">${title || "Slide Title"}</h1>
                  <ul class="bullets">
                    ${bullets.map((b: string) => `<li>${escapeHtml(b)}</li>`).join("")}
                  </ul>
                  <div class="footer">Slide AI</div>
                </div>
              </section>
            `
          }

          // TEXT-LEFT / IMAGE-LEFT
          const leftIsImage = layout === "image-left"

          const bulletsHtml = `
            <div style="flex:1;">
              <h1 class="title">${title || "Slide Title"}</h1>
              <ul class="bullets">
                ${bullets.map((b: string) => `<li>${escapeHtml(b)}</li>`).join("")}
              </ul>
            </div>
          `

          const imageHtml = imageUrl
            ? `<div class="imageBox"><img class="img" src="${imageUrl}" /></div>`
            : `<div class="imageBox"></div>`

          return `
            <section class="slide">
              <div class="contentRow">
                ${leftIsImage ? imageHtml : bulletsHtml}
                ${leftIsImage ? bulletsHtml : imageHtml}
              </div>
              <div class="footer">Slide AI</div>
            </section>
          `
        })
        .join("")}
    </body>
  </html>
  `

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()

  page.setDefaultNavigationTimeout(0)
  page.setDefaultTimeout(0)

  // Daha hızlı: DOM gelsin yeter
  await page.setContent(html, { waitUntil: "domcontentloaded" })

  // Görselleri en fazla 20sn bekle, sonra devam et
  try {
    await page.waitForFunction(() => {
      const imgs = Array.from(document.images || [])
      return imgs.every((img) => (img as HTMLImageElement).complete)
    }, { timeout: 20_000 })
  } catch (e) {
  // görsel takıldıysa bile PDF üretmeye devam
  }
  const pdf = await page.pdf({
    width: "1280px",
    height: "720px",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
  })

  await browser.close()

  const filename = `${doc.title}.pdf`
  const encodedFilename = encodeURIComponent(filename)

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
    },
  })
}
