"use client"

interface Props {
  onAdd: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onSave: () => void
}

export default function SlideToolbar({
  onAdd,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSave,
}: Props) {
  return (
    <div className="flex gap-2 border-b border-zinc-800 p-3">
      <button onClick={onAdd} className="btn">➕ Add</button>
      <button onClick={onDelete} className="btn">🗑 Delete</button>
      <button onClick={onMoveUp} className="btn">⬆ Up</button>
      <button onClick={onMoveDown} className="btn">⬇ Down</button>

      <button
        onClick={onSave}
        className="ml-auto rounded bg-green-600 px-3 py-1 text-white"
      >
        💾 Save
      </button>
    </div>
  )
}
