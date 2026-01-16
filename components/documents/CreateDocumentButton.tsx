"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createDocument } from "@/lib/api";

export default function CreateDocumentButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const doc = await createDocument();
        router.push(`/documents/${doc.id}`);
      } catch (err) {
        alert("Slide oluşturulurken hata oluştu");
        console.error(err);
      }
    });
  };

  return (
    <button
      onClick={handleCreate}
      disabled={isPending}
      className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
    >
      {isPending ? "Oluşturuluyor..." : "New Slide"}
    </button>
  );
}
