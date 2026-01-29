import CreateDocumentForm from "@/components/documents/CreateDocumentForm"
import type { SlideDeck } from "@/types/slide"

export default function GeneratePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Create Slides</h1>
      <CreateDocumentForm onGenerated={(_deck: SlideDeck) => {}} />
    </div>
  )
}
