"use client"

import type { Slide } from "@/types/slide"
import { getThemeByName } from "@/lib/slideThemes"

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Props {
  slides: Slide[]
  activeId: string
  onSelect: (id: string) => void
  onReorder?: (slides: Slide[]) => void
  themeName?: string
}

function buildThumbBg(theme: ReturnType<typeof getThemeByName>): React.CSSProperties {
  const g = theme.gradient
  if (g?.enabled) {
    const dir =
      g.direction === "top-bottom"
        ? "to bottom"
        : g.direction === "bottom-top"
          ? "to top"
          : g.direction === "left-right"
            ? "to right"
            : "to left"

    return {
      backgroundImage: `linear-gradient(${dir}, ${g.from}, ${g.to})`,
      color: theme.palette.foreground,
    }
  }

  return {
    backgroundColor: theme.palette.background,
    color: theme.palette.foreground,
  }
}

function SortableSlideItem({
  slide,
  index,
  active,
  onSelect,
  themeName,
}: {
  slide: Slide
  index: number
  active: boolean
  onSelect: (id: string) => void
  themeName?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  }

  const theme = getThemeByName(themeName)
  const hasImage = !!slide.imagePrompt

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(slide.id)}
      className={[
        "w-full rounded-xl p-2 text-left transition cursor-grab active:cursor-grabbing",
        active
          ? "bg-zinc-900 ring-2 ring-blue-500"
          : "bg-zinc-950 hover:bg-zinc-900/70 border border-zinc-800",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] text-zinc-400">#{index + 1}</div>
        <div
          className={[
            "text-[10px] px-2 py-[2px] rounded-full border",
            hasImage ? "border-emerald-700/50 text-emerald-300" : "border-zinc-700 text-zinc-400",
          ].join(" ")}
        >
          {hasImage ? "img" : "no-img"}
        </div>
      </div>

      <div
        className="aspect-[16/9] rounded-lg overflow-hidden shadow-sm"
        style={buildThumbBg(theme)}
      >
        <div className="p-2">
          <div className="h-[6px] w-10 rounded-full mb-2" style={{ background: theme.palette.accent }} />
          <div className="text-[11px] font-extrabold truncate">{slide.title || "Başlıksız"}</div>

          <ul className="mt-2 space-y-[2px]">
            {(slide.bullets ?? []).slice(0, 2).map((b, i) => (
              <li key={i} className="text-[10px] truncate opacity-80">
                • {b}
              </li>
            ))}
            {(slide.bullets ?? []).length === 0 ? (
              <li className="text-[10px] opacity-50">• (madde yok)</li>
            ) : null}
          </ul>
        </div>
      </div>
    </button>
  )
}

export function SlideList({ slides, activeId, onSelect, onReorder, themeName }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: any) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = slides.findIndex((s) => s.id === active.id)
    const newIndex = slides.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(slides, oldIndex, newIndex)
    onReorder?.(reordered)
  }

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
      <div className="px-3 pt-3 pb-2 text-xs text-zinc-500">Slides</div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="p-3 space-y-3">
            {slides.map((slide, index) => (
              <SortableSlideItem
                key={slide.id}
                slide={slide}
                index={index}
                active={slide.id === activeId}
                onSelect={onSelect}
                themeName={themeName}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </aside>
  )
}
