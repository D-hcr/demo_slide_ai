"use client"

import type { Slide } from "@/types/slide"

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Props {
  slides: Slide[]
  activeId: string
  onSelect: (id: string) => void
  onReorder?: (slides: Slide[]) => void
}

function SortableSlideItem({
  slide,
  index,
  active,
  onSelect,
}: {
  slide: Slide
  index: number
  active: boolean
  onSelect: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(slide.id)}
      className={`w-full rounded-lg p-2 text-left transition cursor-grab active:cursor-grabbing ${
        active ? "bg-zinc-800 ring-2 ring-blue-500" : "bg-zinc-900 hover:bg-zinc-800"
      }`}
    >
      <div className="text-xs text-zinc-400 mb-1">{index + 1}</div>

      <div className="aspect-[16/9] rounded-md bg-white text-black p-2 shadow">
        <div className="text-[10px] font-semibold truncate">{slide.title || "Başlıksız"}</div>

        <ul className="mt-1 space-y-[2px]">
          {slide.bullets?.slice(0, 3).map((b, i) => (
            <li key={i} className="text-[9px] truncate opacity-80">
              • {b}
            </li>
          ))}
        </ul>
      </div>
    </button>
  )
}

export function SlideList({ slides, activeId, onSelect, onReorder }: Props) {
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
    <aside className="w-56 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </aside>
  )
}
