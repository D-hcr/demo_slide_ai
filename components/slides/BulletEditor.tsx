"use client";

import { KeyboardEvent, useMemo } from "react";

interface Props {
  bullets: any; // ✅ null gelebiliyor
  onChange: (bullets: string[]) => void;
}

export default function BulletEditor({ bullets, onChange }: Props) {
  const safeBullets = useMemo<string[]>(() => {
    if (Array.isArray(bullets)) return bullets.map((x) => String(x ?? ""));
    // ✅ null/undefined gelirse en az 1 input göster
    return [""];
  }, [bullets]);

  function updateBullet(index: number, value: string) {
    const next = [...safeBullets];
    next[index] = value;
    onChange(next);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    // ENTER → yeni bullet
    if (e.key === "Enter") {
      e.preventDefault();
      const next = [...safeBullets];
      next.splice(index + 1, 0, "");
      onChange(next);

      setTimeout(() => {
        document.getElementById(`bullet-${index + 1}`)?.focus();
      });
    }

    // BACKSPACE → boşsa sil
    if (e.key === "Backspace" && safeBullets[index] === "" && safeBullets.length > 1) {
      e.preventDefault();
      const next = safeBullets.filter((_, i) => i !== index);
      onChange(next);

      setTimeout(() => {
        document.getElementById(`bullet-${Math.max(index - 1, 0)}`)?.focus();
      });
    }
  }

  return (
    <div className="space-y-3">
      {safeBullets.map((bullet, i) => (
        <input
          key={i}
          id={`bullet-${i}`}
          value={bullet}
          onChange={(e) => updateBullet(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2"
          placeholder="• Madde"
        />
      ))}
    </div>
  );
}
