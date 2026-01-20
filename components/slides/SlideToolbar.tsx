"use client"

interface Props {
  onAdd: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export default function SlideToolbar({
  onAdd,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  return (
    <div className="flex gap-2 border-b border-zinc-800 p-3">
      <button
        onClick={onAdd}
        className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
      >
        ➕ Add
      </button>

      <button
        onClick={onDelete}
        className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
      >
        🗑 Delete
      </button>

      <button
        onClick={onMoveUp}
        className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
      >
        ⬆ Up
      </button>

      <button
        onClick={onMoveDown}
        className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
      >
        ⬇ Down
      </button>
    </div>
  )
}
