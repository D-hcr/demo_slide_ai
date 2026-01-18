import CreateDocumentForm from "@/components/documents/CreateDocumentForm";

export default function GeneratePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Create Slides</h1>
      <CreateDocumentForm />
    </div>
  );
}
