"use client"

export type ChatRole = "user" | "assistant" | "system"

export default function ChatMessage({
  role,
  content,
}: {
  role: ChatRole
  content: string
}) {
  const isUser = role === "user"

  return (
    <div
      className={`flex mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : role === "system"
            ? "bg-zinc-800 text-zinc-300 italic"
            : "bg-zinc-900 text-zinc-100 rounded-bl-none"}
        `}
      >
        {content}
      </div>
    </div>
  )
}
