import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DocumentEditor from "@/components/editor/document-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: PageProps) {
  // ✅ Next.js 15/16 params çözümü
  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id },
  });

  if (!document) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow dark:bg-zinc-900">
        <DocumentEditor
          id={document.id}
          initialTitle={document.title}
          initialContent={document.content}
        />
      </div>
    </div>
  );
}
