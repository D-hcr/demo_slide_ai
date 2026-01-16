"use client";

import { useEffect, useState } from "react";

type Props = {
  id: string;
  initialTitle: string;
  initialContent: string;
};

export default function DocumentEditor({
  id,
  initialTitle,
  initialContent,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    setStatus("saving");

    const timeout = setTimeout(async () => {
      await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      setStatus("saved");
    }, 800);

    return () => clearTimeout(timeout);
  }, [title, content, id]);

  return (
    <div className="space-y-4">
      <input
        className="w-full text-2xl font-bold outline-none bg-transparent"
        placeholder="Başlık"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="min-h-[300px] w-full resize-none outline-none bg-transparent"
        placeholder="İçeriği yaz..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="text-sm text-zinc-500">
        {status === "saving" && "Kaydediliyor..."}
        {status === "saved" && "Kaydedildi ✓"}
      </div>
    </div>
  );
}
