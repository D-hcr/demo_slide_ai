// /components/slides/SlideToolbar.tsx
"use client"

interface Props {
  onAdd: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onSave: () => void
  onRegenerateText: () => void
  onRegenerateImage: () => void

  // ✅ EXPORT
  onExportPdf: () => void
  onExportPptx: () => void
  isExportingPdf: boolean
  isExportingPptx: boolean

  // ✅ UNDO
  onUndo: () => void
  canUndo: boolean
  isUndoing: boolean

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
  onRegenerateText,
  onRegenerateImage,

  onExportPdf,
  onExportPptx,
  isExportingPdf,
  isExportingPptx,

  onUndo,
  canUndo,
  isUndoing,

  isSaving,
  isDirty,
}: Props) {
  return (
    <div className="flex gap-2 border-b border-zinc-800 p-3 items-center">
      <button onClick={onAdd} className="btn">➕ Add</button>
      <button onClick={onDelete} className="btn">🗑 Delete</button>
      <button onClick={onMoveUp} className="btn">⬆ Up</button>
      <button onClick={onMoveDown} className="btn">⬇ Down</button>

      {/* ✅ UNDO */}
      <button
        onClick={onUndo}
        disabled={!canUndo || isUndoing}
        className="btn disabled:opacity-50"
        title={canUndo ? "Geri al" : "Geri alınacak geçmiş yok"}
      >
        {isUndoing ? "↩ Undo..." : "↩ Undo"}
      </button>

      <button onClick={onRegenerateText} className="btn">♻️ Regenerate Text</button>
      <button onClick={onRegenerateImage} className="btn">🖼 Regenerate Image</button>

      {/* ✅ EXPORTS */}
      <button
        onClick={onExportPdf}
        disabled={isExportingPdf}
        className="btn disabled:opacity-50"
        title="PDF olarak indir"
      >
        {isExportingPdf ? "📄 PDF..." : "📄 PDF Export"}
      </button>

      <button
        onClick={onExportPptx}
        disabled={isExportingPptx}
        className="btn disabled:opacity-50"
        title="PPTX olarak indir"
      >
        {isExportingPptx ? "📦 PPTX..." : "📦 PPTX Export"}
      </button>

      {/* SAVE */}
      <button
        onClick={onSave}
        disabled={isSaving || !isDirty}
        className="ml-auto rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
        title={isDirty ? "Kaydet" : "Değişiklik yok"}
      >
        {isSaving ? "💾 Saving..." : "💾 Save"}
      </button>
    </div>
  )
}
