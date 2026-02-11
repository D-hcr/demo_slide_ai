import type { SlideTheme } from "@/types/slide"

function escapeHtml(input: string) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function escapeAttr(input: string) {
  // HTML attribute içinde güvenli kullanım için basit kaçış
  return escapeHtml(input).replaceAll("`", "&#096;")
}

function cssGradient(theme: SlideTheme) {
  const g = theme.gradient
  if (!g?.enabled) return ""
  const from = g.from
  const to = g.to

  switch (g.direction) {
    case "bottom-top":
      return `linear-gradient(0deg, ${from}, ${to})`
    case "left-right":
      return `linear-gradient(90deg, ${from}, ${to})`
    case "right-left":
      return `linear-gradient(270deg, ${from}, ${to})`
    case "top-bottom":
    default:
      return `linear-gradient(180deg, ${from}, ${to})`
  }
}

export function buildSlidesHtml(slides: any[], theme: SlideTheme) {
  const bg = theme.palette?.background ?? (theme as any).exportBackground ?? "#ffffff"
  const fg = theme.palette?.foreground ?? (theme as any).exportText ?? "#111111"
  const accent = theme.palette?.accent ?? (theme as any).exportAccent ?? "#2563eb"

  const overlayEnabled = !!(theme.overlay?.enabled || theme.imageStyle?.overlayOnImage)
  const overlayColor = theme.overlay?.color ?? "#000000"
  const overlayOpacity = typeof theme.overlay?.opacity === "number" ? theme.overlay.opacity : 0.45

  const g = cssGradient(theme)
  const radius = theme.imageStyle?.radius ?? 20
  const shadowCss = theme.imageStyle?.shadow ? "0 18px 50px rgba(0,0,0,0.25)" : "none"

  const slideSections = slides
    .map((s: any, idx: number) => {
      const title = escapeHtml(s?.title ?? "")
      const bullets = Array.isArray(s?.bullets) ? s.bullets : []
      const imageUrl = typeof s?.imageUrl === "string" ? s.imageUrl : ""
      const layout = (s?.layout as string) || "text-left"

      const bulletsLis = bullets
        .filter(Boolean)
        .map((b: string) => `<li>${escapeHtml(b)}</li>`)
        .join("")

      // FULL IMAGE
      if (layout === "full-image") {
        const bgEl = imageUrl
          ? `<div class="bgCover" style="background-image:url('${escapeAttr(imageUrl)}')"></div>`
          : `<div class="bgPlaceholder"></div>`

        const overlayEl = overlayEnabled ? `<div class="overlay"></div>` : ``

        return `
          <section class="slide fullImage">
            ${bgEl}
            ${overlayEl}

            <div class="inner">
              <div class="topBar">
                <div class="accent"></div>
                <div class="meta">Slide ${idx + 1}</div>
              </div>

              <h1 class="title">${title || "Slide Title"}</h1>

              ${bulletsLis ? `<ul class="bullets">${bulletsLis}</ul>` : ""}

              <div class="footer">Slide AI</div>
            </div>
          </section>
        `
      }

      const leftIsImage = layout === "image-left"

      const textBlock = `
        <div class="textCol">
          <div class="topBar">
            <div class="accent"></div>
            <div class="meta">Slide ${idx + 1}</div>
          </div>

          <h1 class="title">${title || "Slide Title"}</h1>

          ${
            bulletsLis
              ? `<ul class="bullets">${bulletsLis}</ul>`
              : `<div class="emptyHint">Bu slaytta madde yok.</div>`
          }
        </div>
      `
      const imageBlock = imageUrl
        ? `<div class="imgCol">
            <div class="imgWrap hasImg">
              <img class="img" src="${escapeAttr(imageUrl)}" />
            </div>
          </div>`
        : `<div class="imgCol placeholder">
            <div class="imgWrap phBox">
              <div class="phTitle">Görsel yok</div>
              <div class="phSub">ImagePrompt ekleyip “Regenerate Image” yapabilirsin.</div>
            </div>
          </div>`


      return `
        <section class="slide">
          <div class="grid">
            ${leftIsImage ? imageBlock : textBlock}
            ${leftIsImage ? textBlock : imageBlock}
          </div>
          <div class="footer">Slide AI</div>
        </section>
      `
    })
    .join("")

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: 1280px 720px; margin: 0; }
        html, body { margin: 0; padding: 0; }
        body {
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: #000;
        }

        .slide {
          width: 1280px;
          height: 720px;
          box-sizing: border-box;
          padding: 64px 72px;
          position: relative;
          page-break-after: always;
          break-after: page;
          background: ${g ? g : bg};
          color: ${fg};
          overflow: hidden;
        }

        .topBar {
          display:flex;
          align-items:center;
          gap: 14px;
          margin-bottom: 18px;
        }
        .accent {
          width: 56px;
          height: 10px;
          border-radius: 999px;
          background: ${accent};
        }
        .meta {
          font-size: 14px;
          opacity: 0.55;
          letter-spacing: 0.2px;
        }

        .title {
          font-size: 54px;
          font-weight: 800;
          margin: 0 0 22px 0;
          line-height: 1.08;
        }

        .grid {
          display: flex;
          gap: 44px;
          height: 100%;
        }

        .textCol { flex: 1; min-width: 0; }

        .bullets {
          margin: 0;
          padding-left: 26px;
          font-size: 30px;
          line-height: 1.35;
        }
        .bullets li { margin: 10px 0; }
        .bullets li::marker { color: ${accent}; }

        .emptyHint { margin-top: 18px; font-size: 18px; opacity: 0.55; }

        .imgCol {
          width: 40%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .imgWrap{
          width: 100%;
          height: 78%;
          border-radius: ${radius}px;
          overflow: hidden;
          display:flex;
          align-items:center;
          justify-content:center;
          box-sizing: border-box;
        }

        .imgWrap.hasImg{
          background: transparent;
          border: none;
        }

        .img {
          width: 100%;
          height: 100%;
          object-fit: contain; /* cover yerine contain */
          border-radius: ${theme.imageStyle?.radius ?? 20}px;
          ${theme.imageStyle?.shadow ? "box-shadow: 0 18px 50px rgba(0,0,0,0.25);" : "box-shadow: none;"}
        }

        .imgCover {
          width: 100%;
          height: 78%;
          border-radius: ${radius}px;
          box-shadow: ${shadowCss};
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          /* bazı render’larda daha stabil olsun */
          transform: translateZ(0);
        }

        .imgCol.placeholder .phBox{
          width: 100%;
          height: 78%;
          border-radius: ${radius}px;
          background: rgba(0,0,0,0.06);
          border: 1px dashed rgba(0,0,0,0.22);
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          text-align:center;
          padding: 26px;
          box-sizing:border-box;
        }
        .phTitle{ font-size: 20px; font-weight: 700; opacity: 0.75; margin-bottom: 8px;}
        .phSub{ font-size: 14px; opacity: 0.6; line-height: 1.4; max-width: 320px;}

        /* FULL IMAGE */
        .fullImage { padding: 0; background: ${g ? g : bg}; }
        .fullImage .bgCover,
        .fullImage .bgPlaceholder {
          position: absolute;
          inset: 0;
          width: 1280px;
          height: 720px;
        }
        .fullImage .bgCover {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transform: translateZ(0);
        }
        .fullImage .bgPlaceholder {
          background: ${g ? g : `linear-gradient(135deg, rgba(0,0,0,0.10), rgba(0,0,0,0.25))`};
        }
        .fullImage .overlay {
          position: absolute;
          inset: 0;
          background: ${overlayColor};
          opacity: ${overlayOpacity};
        }

        .fullImage .inner {
          position: relative;
          padding: 64px 72px;
        - height: 720px;
        - weight: 800px;
        - box-sizing: border-box;
        + height: 100%;
        + weight: 100%;
        + box-sizing: border-box;
          color: #fff;
        }

        .fullImage .title,
        .fullImage .bullets { color: #fff; }
        .fullImage .meta { color: rgba(255,255,255,0.75); }

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
      ${slideSections}
    </body>
  </html>
  `
}
