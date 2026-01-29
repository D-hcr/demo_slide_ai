"use client"

import { useState } from "react"

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void
  disabled?: boolean
}) {
  const [text, setText] = useState("")

  function handleSend() {
    if (!text.trim()) return
    onSend(text.trim())
    setText("")
  }

  return (
    <div className="border-t border-zinc-800 p-4 bg-zinc-950">
      <div className="flex gap-2">
        <textarea
          rows={1}
          placeholder="Sunum konusu yaz… (örn: Yapay Zeka ve Gelecek)"
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          className="
            flex-1 resize-none rounded-xl bg-zinc-900 px-4 py-3
            text-sm text-zinc-100 placeholder:text-zinc-500
            focus:outline-none focus:ring-2 focus:ring-blue-600
          "
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          className="
            rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium
            text-white hover:bg-blue-700 disabled:opacity-50
          "
        >
          Gönder
        </button>
      </div>
    </div>
  )
}
