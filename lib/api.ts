export async function createDocument() {
  const res = await fetch("/api/documents/create", {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Document oluşturulamadı");
  }

  return res.json();
}
