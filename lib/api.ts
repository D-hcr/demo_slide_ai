// /lib/api.ts
export async function createDocument() {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Document oluşturulamadı");
  return res.json();
}
