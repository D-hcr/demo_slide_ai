export async function renderPdfViaWorker(args: { workerUrl: string; html: string }) {
  const res = await fetch(args.workerUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ html: args.html }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`PDF worker failed (${res.status}): ${txt || "unknown error"}`)
  }

  // Buffer yerine Uint8Array -> Edge/Workers uyumlu
  return new Uint8Array(await res.arrayBuffer())
}
