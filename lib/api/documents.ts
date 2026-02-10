export async function updateDocument(
  id: string,
  data: {
    title?: string
    slides?: any[]
    themeName?: string
  }
) {
  const res = await fetch(`/api/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error("Document update failed")
  return res.json()
}
