"use client"

// /components/about/AboutContent.tsx
import { useEffect, useMemo, useState } from "react"

function GithubIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={props.className ?? "h-4 w-4"}
      fill="currentColor"
    >
      <path d="M12 .5C5.73.5.75 5.74.75 12.2c0 5.17 3.44 9.56 8.2 11.1.6.12.83-.27.83-.58v-2.2c-3.34.75-4.04-1.45-4.04-1.45-.55-1.44-1.34-1.82-1.34-1.82-1.1-.78.08-.76.08-.76 1.22.09 1.86 1.28 1.86 1.28 1.08 1.9 2.84 1.35 3.53 1.03.11-.8.42-1.35.76-1.66-2.67-.31-5.48-1.38-5.48-6.14 0-1.36.46-2.47 1.23-3.34-.12-.31-.53-1.57.12-3.27 0 0 1-.33 3.3 1.28.96-.27 1.98-.4 3-.4 1.02 0 2.04.13 3 .4 2.3-1.61 3.3-1.28 3.3-1.28.65 1.7.24 2.96.12 3.27.77.87 1.23 1.98 1.23 3.34 0 4.78-2.82 5.82-5.5 6.13.43.38.82 1.12.82 2.26v3.35c0 .32.22.7.83.58 4.77-1.55 8.2-5.93 8.2-11.1C23.25 5.74 18.27.5 12 .5z" />
    </svg>
  )
}

type PromptItem = { baslik: string; prompt: string }

export default function AboutContent() {
  const githubUrl = "https://github.com/D-hcr/demo_slide_ai"

  const prompts: PromptItem[] = useMemo(
    () => [
      {
        baslik: "Eğitim sunumu (META ile)",
        prompt:
          `Konu: "Güneş Sistemi"\nHedef kitle: "Ortaokul"\nTon: "Eğlenceli ve anlaşılır"\nDil: Türkçe\n\n8–10 slaytlık sunum oluştur. Slaytlar arasında layout çeşitliliği kullan (text-left / image-left / full-image). Her slaytta 3–5 madde olsun ve her slayt için benzersiz imagePrompt üret.`,
      },
      {
        baslik: "Siber güvenlik farkındalık (Phishing)",
        prompt:
          `Konu: "Phishing (oltalama) saldırıları ve korunma"\nHedef kitle: "Genel çalışanlar"\nTon: "Net, pratik"\nDil: Türkçe\n\n9 slaytlık sunum oluştur: phishing nedir, yaygın yöntemler, örnek senaryolar, uyarı işaretleri, güvenli davranışlar, raporlama adımları, kısa özet. Her slayt 3–5 madde ve benzersiz imagePrompt içersin.`,
      },
      {
        baslik: "Startup pitch deck (yapılandırılmış)",
        prompt:
          `Konu: "AI destekli slayt üretici"\nHedef kitle: "Yatırımcı"\nTon: "Kurumsal, ikna edici"\nDil: Türkçe\n\n10 slaytlık pitch deck oluştur: Problem, Çözüm, Ürün, Pazar, İş modeli, Traction, Rekabet, Go-To-Market, Takım, Finans. Madde ve başlıklar kısa/slide-friendly olsun. Layout’ları sırayla çeşitlendir.`,
      },
      {
        baslik: "Bilgisayar ve Oyun Sistemleri (detaylı)",
        prompt:
          `Konu: "Bilgisayar ve Oyun Sistemleri"\nHedef kitle: "Üniversite öğrencileri"\nTon: "Detaylı"\nDil: Türkçe\n\n8–10 slayt oluştur: CPU vs GPU, RAM, depolama, oyun motorları, rendering pipeline temelleri, performans ölçümü (profiling), optimizasyon teknikleri, özet. Her slayt 3–5 madde ve benzersiz imagePrompt içersin (flat vector, minimal, arka plan temiz, görsel içinde yazı yok).`,
      },
      {
        baslik: "Ürün/özellik özeti (kurumsal)",
        prompt:
          `Konu: "Slide AI ürün özeti"\nHedef kitle: "Ürün yöneticileri"\nTon: "Kurumsal"\nDil: Türkçe\n\n9 slayt oluştur: genel bakış, ana özellikler (AI metin, AI görsel, undo/redo, autosave), iş akışı, PDF/PPTX export, güvenlik/auth, kullanım senaryoları, sınırlılıklar, roadmap, özet. Her slaytta 3–5 madde ve benzersiz imagePrompt olsun.`,
      },
      {
        baslik: "Türkçe + İngilizce terimler (kontrollü)",
        prompt:
          `Konu: "Bulut bilişim temelleri"\nHedef kitle: "Yeni başlayan"\nTon: "Anlaşılır"\nDil: Türkçe\n\nSunumu Türkçe yaz. Yalnızca gerekli teknik terimlerde İngilizce karşılığını parantez içinde ver (ör: ölçeklenebilirlik (scalability)). 8–10 slayt, her slayt 3–5 madde ve benzersiz imagePrompt.`,
      },
    ],
    []
  )

  const [kopyalandiKey, setKopyalandiKey] = useState<string | null>(null)

  useEffect(() => {
    if (!kopyalandiKey) return
    const t = setTimeout(() => setKopyalandiKey(null), 1200)
    return () => clearTimeout(t)
  }, [kopyalandiKey])

  async function panoyaKopyala(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setKopyalandiKey(key)
    } catch {
      // fallback
      try {
        const el = document.createElement("textarea")
        el.value = text
        document.body.appendChild(el)
        el.select()
        document.execCommand("copy")
        el.remove()
        setKopyalandiKey(key)
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              Slide AI — Hakkımda
            </div>

            <p className="mt-3 text-zinc-300 leading-relaxed">
              Slide AI, tek bir konudan komple sunum üretir: başlıklar, madde içerikleri ve görsel prompt’ları.
              Slaytları düzenleyebilir, AI ile yenileyebilir ve sunumunu PDF veya PPTX olarak dışa aktarabilirsin.
              META (Konu / Hedef kitle / Ton) alanları sunumun dilini ve detay seviyesini daha tutarlı yapar.
            </p>
          </div>

          {/* GitHub secondary button (icon + modern) */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900 hover:border-zinc-600"
          >
            <GithubIcon className="h-4 w-4 text-zinc-200" />
            GitHub
          </a>
        </div>

        <div className="mt-4 text-sm text-zinc-400">
          Proje koduna bakmak istersen GitHub reposu:{" "}
          <a
            className="text-zinc-200 underline underline-offset-4 hover:text-white"
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
          >
            {githubUrl}
          </a>
        </div>

        <div className="mt-4 text-xs text-zinc-500">
          İpucu: Prompt’a <span className="text-zinc-300">Dil: Türkçe</span> satırını eklemek chat çıktısını daha stabil Türkçe tutar.
        </div>
      </div>

      {/* PROMPTS */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-white">
              Bu sisteme uygun örnek promptlar
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              META + 8–10 slayt + 3–5 madde + benzersiz imagePrompt formatına göre hazırlandı.
            </div>
          </div>

          {/* küçük “toast” */}
          <div
            className={[
              "text-xs px-3 py-1 rounded-full border",
              kopyalandiKey ? "opacity-100" : "opacity-0",
              "transition-opacity duration-200",
              "bg-zinc-900 border-zinc-700 text-zinc-200",
            ].join(" ")}
            aria-live="polite"
          >
            Panoya kopyalandı!
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {prompts.map((item, i) => {
            const key = `prompt-${i}`
            const isCopied = kopyalandiKey === key

            return (
              <div
                key={key}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{item.baslik}</div>

                  <button
                    type="button"
                    onClick={() => panoyaKopyala(item.prompt, key)}
                    className={[
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border transition",
                      isCopied
                        ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-200"
                        : "bg-zinc-950/60 border-zinc-700 text-zinc-200 hover:bg-zinc-950 hover:border-zinc-600",
                    ].join(" ")}
                    title="Prompt'u kopyala"
                  >
                    {isCopied ? "✓ Kopyalandı" : "Kopyala"}
                  </button>
                </div>

                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-950/60 border border-zinc-800 p-3 text-[13px] leading-relaxed text-zinc-200">
                  {item.prompt}
                </pre>
              </div>
            )
          })}
        </div>
      </div>

      {/* İPUÇLARI */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-7">
        <div className="text-sm font-semibold text-white">Daha iyi sonuç için</div>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300 list-disc pl-5">
          <li>Prompt’a mutlaka <b>Dil: Türkçe</b> ekle (en stabil yöntem).</li>
          <li>META alanlarını doldur: Konu / Hedef kitle / Ton.</li>
          <li>“8–10 slayt” + “3–5 madde” kuralını yaz.</li>
          <li>Görseller için “flat vector, minimal, görselde yazı yok” iste.</li>
        </ul>
      </div>
    </div>
  )
}
