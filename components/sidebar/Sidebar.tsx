"use client";

import UserProfile from "./UserProfile";
import PresentationList from "./PresentationList";

export default function Sidebar({
  user,
  presentations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onDuplicate,
}: {
  user: any;
  presentations: any[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, nextTitle: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
      <UserProfile name={user?.name} email={user?.email} image={user?.image} />

      <PresentationList
        items={presentations}
        activeId={activeId}
        onSelect={onSelect}
        onNew={onNew}
        onRename={onRename}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
      />
    </aside>
  );
}
