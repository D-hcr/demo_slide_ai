"use client"

interface Props {
  onAdd: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
  deckId: string
}

export default function SlideToolbar({
  onAdd,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSave,
  isSaving,
  isDirty,
  deckId,
}: Props) {
  return (
    <div className="flex gap-2 border-b border-zinc-800 p-3">
      <button onClick={onAdd} className="btn">➕ Add</button>
      <button onClick={onDelete} className="btn">🗑 Delete</button>
      <button onClick={onMoveUp} className="btn">⬆ Up</button>
      <button onClick={onMoveDown} className="btn">⬇ Down</button>

      <button
        onClick={onSave}
        disabled={isSaving}
        className="ml-auto rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
      >
        {isSaving ? "💾 Saving..." : "💾 Save"}
      </button>

      <button
        onClick={() =>
          window.open(
            `/api/documents/${deckId}/export/pdf`,
            "_self"
          )
        }
        className="px-3 py-1 bg-zinc-700 text-white rounded"
      >
        📄 PDF Export
      </button>
    </div>
  )
}
