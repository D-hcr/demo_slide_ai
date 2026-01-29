"use client";

import { useMemo, useState } from "react";

type Presentation = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function PresentationList({
  items,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onDuplicate,
}: {
  items: Presentation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, nextTitle: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => (p.title ?? "").toLowerCase().includes(q));
  }, [items, query]);

  function startRename(p: Presentation) {
    setEditingId(p.id);
    setDraftTitle(p.title ?? "");
  }

  function cancelRename() {
    setEditingId(null);
    setDraftTitle("");
  }

  function commitRename(id: string) {
    const next = draftTitle.trim();
    if (!next) return cancelRename();
    onRename(id, next);
    cancelRename();
  }

  return (
    <div className="flex flex-col h-full">
      {/* NEW BUTTON */}
      <div className="p-4 space-y-3">
        <button
          onClick={onNew}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New presentation
        </button>

        {/* SEARCH */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ara: sunum başlığı…"
          className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 && (
          <div className="text-xs text-zinc-500 text-center mt-8">
            {items.length === 0 ? "Henüz sunum yok" : "Eşleşen sunum yok"}
          </div>
        )}

        {filtered.map((p) => {
          const isActive = p.id === activeId;
          const isEditing = editingId === p.id;

          return (
            <div
              key={p.id}
              className={`group mb-1 rounded-lg ${
                isActive ? "bg-zinc-800" : "hover:bg-zinc-900"
              }`}
            >
              {/* Row */}
              <button
                onClick={() => {
                  if (isEditing) return;
                  onSelect(p.id);
                }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm ${
                  isActive ? "text-white" : "text-zinc-400 group-hover:text-white"
                }`}
              >
                {/* Title / Inline editor */}
                {isEditing ? (
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(p.id);
                      if (e.key === "Escape") cancelRename();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="w-full rounded-md bg-zinc-900 px-2 py-1 text-sm text-zinc-100 border border-zinc-700 focus:outline-none focus:border-zinc-500"
                  />
                ) : (
                  <div className="font-medium truncate">{p.title}</div>
                )}

                <div className="text-xs text-zinc-500 mt-1">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </div>
              </button>

              {/* ACTIONS */}
              <div className="px-3 pb-2 flex gap-3 opacity-0 group-hover:opacity-100 transition">
                {isEditing ? (
                  <>
                    <button
                      className="text-xs text-zinc-300 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        commitRename(p.id);
                      }}
                    >
                      ✓ Kaydet
                    </button>
                    <button
                      className="text-xs text-zinc-400 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        cancelRename();
                      }}
                    >
                      Esc İptal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="text-xs text-zinc-400 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startRename(p);
                      }}
                    >
                      ✏ Rename
                    </button>

                    <button
                      className="text-xs text-zinc-400 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDuplicate(p.id);
                      }}
                    >
                      ⧉ Duplicate
                    </button>

                    <button
                      className="text-xs text-red-400 hover:text-red-300 ml-auto"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const ok = window.confirm("Bu sunumu silmek istiyor musun?");
                        if (!ok) return;
                        onDelete(p.id);
                      }}
                    >
                      🗑 Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
