// app/generate/GenerateClient.tsx
"use client"

import { useRouter } from "next/navigation"
import CreateDocumentForm from "@/components/documents/CreateDocumentForm"
import type { SlideDeck } from "@/types/slide"

export default function GenerateClient() {
  const router = useRouter()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Create Slides</h1>

      <CreateDocumentForm
        onGenerated={(deck: SlideDeck) => {
          // ✅ deck oluşturulunca çalışma sayfasına git
          // (senin projende ana edit sayfası "/" ise bu yeterli)
          router.push(`/?id=${deck.id}`)
        }}
      />
    </div>
  )
}
