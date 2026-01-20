"use client"

import { KeyboardEvent } from "react"

interface Props {
  bullets: string[]
  onChange: (bullets: string[]) => void
}

export default function BulletEditor({ bullets, onChange }: Props) {
  function updateBullet(index: number, value: string) {
    const next = [...bullets]
    next[index] = value
    onChange(next)
  }

  function handleKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    // ENTER → yeni bullet
    if (e.key === "Enter") {
      e.preventDefault()
      const next = [...bullets]
      next.splice(index + 1, 0, "")
      onChange(next)

      setTimeout(() => {
        document
          .getElementById(`bullet-${index + 1}`)
          ?.focus()
      })
    }

    // BACKSPACE → boşsa sil
    if (
      e.key === "Backspace" &&
      bullets[index] === "" &&
      bullets.length > 1
    ) {
      e.preventDefault()
      const next = bullets.filter((_, i) => i !== index)
      onChange(next)

      setTimeout(() => {
        document
          .getElementById(
            `bullet-${Math.max(index - 1, 0)}`
          )
          ?.focus()
      })
    }
  }

  return (
    <div className="space-y-3">
      {bullets.map((bullet, i) => (
        <input
          key={i}
          id={`bullet-${i}`}
          value={bullet}
          onChange={(e) =>
            updateBullet(i, e.target.value)
          }
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2"
          placeholder="• Madde"
        />
      ))}
    </div>
  )
}
