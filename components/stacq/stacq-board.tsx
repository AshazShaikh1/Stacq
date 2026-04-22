"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  updateStacq,
  updateResourceOrders,
  renameSection,
  deleteSection,
} from "@/lib/actions/mutations";
import {
  Plus,
  GripVertical,
  Edit2,
  Check,
  X,
  ChevronDown,
  Trash2,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceCard } from "./resource-card";
import { EmptyState } from "@/components/stacq/empty-state";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Resource, Stacq } from "@/lib/types";

// --- Subcomponents for DnD Contexts ---

interface SortableSectionProps {
  id: string;
  sectionName: string;
  items: Resource[];
  isOwner: boolean;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  isSectionDragging?: boolean;
  availableSections: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function SortableSection({
  id,
  sectionName,
  items,
  isOwner,
  onRename,
  onDelete,
  isSectionDragging,
  availableSections,
  isCollapsed,
  onToggleCollapse,
}: SortableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(sectionName);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "Section" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    const val = editValue.trim();
    if (val && val !== sectionName) {
      onRename(sectionName, val);
    }
    setIsEditing(false);
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="relative bg-surface/30 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border/50 space-y-4"
    >
      {/* 1. Drag Handle: Now acts as the top "border" area */}
      {isOwner && !isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="touch-none flex justify-center w-full py-1 mb-1 cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
        </div>
      )}

      {/* 2. Title Section: Now has full width below the handle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-9 font-bold text-base bg-background w-full"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleSave}
                  className="p-2 bg-primary/10 text-primary rounded-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-muted-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <h2 className="text-lg md:text-2xl font-black tracking-tight text-foreground leading-tight wrap-break-word">
              {sectionName}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isOwner && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                title="Rename section"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {sectionName !== "Default" && (
                <button
                  onClick={async () => {
                    if (
                      !confirm(
                        `Remove section "${sectionName}"? Its resources will move to Default.`,
                      )
                    )
                      return;
                    setIsDeleting(true);
                    onDelete(sectionName);
                  }}
                  disabled={isDeleting}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-40"
                  title="Remove section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${
                isCollapsed ? "-rotate-90" : "rotate-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Resources Container — CSS grid trick for smooth collapse animation */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100"
        } ${isSectionDragging ? "opacity-0" : ""}`}
      >
        <div className="overflow-hidden">
          <SortableContext
            id={id}
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4 min-h-[40px] p-1 pt-2 rounded-xl">
              {items.map((item, idx) => (
                <SortableResource
                  key={item.id}
                  item={item}
                  isOwner={isOwner}
                  availableSections={availableSections}
                  priority={idx < 2}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
    </section>
  );
}

interface SortableResourceProps {
  item: Resource;
  isOwner: boolean;
  availableSections: string[];
  priority?: boolean;
}

function SortableResource({
  item,
  isOwner,
  availableSections,
  priority = false,
}: SortableResourceProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: "Resource" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/resource">
      {isOwner && (
        <div
          {...attributes}
          {...listeners}
          className="touch-none absolute left-1/2 -translate-x-1/2 -top-1.5 z-20 cursor-grab active:cursor-grabbing sm:static sm:translate-x-0 sm:left-auto sm:top-auto sm:w-auto"
        >
          {/* Mobile Handle: Tiny thin pill to avoid adding height */}
          <div className="sm:hidden bg-surface border border-border px-4 py-0.5 rounded-full shadow-sm">
            <div className="w-6 h-0.5 bg-muted-foreground/20 rounded-full" />
          </div>

          {/* Desktop Handle: Traditional Side Grip */}
          <div className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 -translate-x-full p-2 opacity-0 group-hover/resource:opacity-100 transition-opacity rounded-md bg-surface border border-border text-muted-foreground">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      )}
      <ResourceCard
        resource={item}
        isOwner={isOwner}
        availableSections={availableSections}
        priority={priority}
      />
    </div>
  );
}

// --- Read-only collapsible sections for non-owners ---

function ReadonlySections({
  sections,
  items,
}: {
  sections: string[];
  items: Record<string, Resource[]>;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (sec: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(sec)) next.delete(sec);
      else next.add(sec);
      return next;
    });
  };

  const visibleSections = sections.filter((s) => items[s]?.length > 0);

  if (visibleSections.length === 0) return <EmptyState />;

  return (
    <GhostCardWrapper>
      <div className="space-y-4 md:space-y-6 pt-2">
        {visibleSections.map((section) => {
          const isCollapsed = collapsed.has(section);
          const isDefault = section === "Default";
          return (
            <section
              key={section}
              className="bg-surface/30 rounded-2xl md:rounded-3xl border border-border/50 overflow-hidden"
            >
              {/* Section header — shown for ALL sections; Default gets a subtle label */}
              <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/40">
                <h2
                  className={`font-black tracking-tight text-foreground leading-tight ${
                    isDefault
                      ? "text-xs uppercase tracking-widest text-muted-foreground"
                      : "text-lg md:text-2xl"
                  }`}
                >
                  {isDefault ? "Resources" : section}
                </h2>
                <button
                  onClick={() => toggle(section)}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  aria-label={
                    isCollapsed ? `Expand ${section}` : `Collapse ${section}`
                  }
                >
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isCollapsed ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </button>
              </div>

              {/* Resources — smooth CSS grid collapse */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isCollapsed
                    ? "grid-rows-[0fr] opacity-0"
                    : "grid-rows-[1fr] opacity-100"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-4 p-4 md:p-6">
                    {items[section].map((item: Resource) => (
                      <ResourceCard
                        key={item.id}
                        resource={item}
                        isOwner={false}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </GhostCardWrapper>
  );
}

// --- Ghost Card wrapper (non-owner view) ---
function GhostCardWrapper({ children }: { children: React.ReactNode }) {
  const { session, openAuthModal } = useAuth();
  return (
    <>
      {children}
      {!session && (
        <button
          id="ghost-card-cta"
          onClick={() => openAuthModal("signup")}
          className="w-full mt-4 border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl md:rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-center transition-all group active:scale-[0.99] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Bookmark className="w-5 h-5 text-primary" />
          </div>
          <p className="font-black text-sm text-foreground">
            + Add your first link. Start your vault.
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Free to join · No credit card required
          </p>
        </button>
      )}
    </>
  );
}

// --- Main Board Component ---

// Pure helper — converts Stacq → { sections, groupedResources }
function parseStacq(stacq: Stacq) {
  const sectionSet = new Set<string>(stacq.section_order || []);
  const resources = stacq.resources || [];
  resources.forEach((r) => sectionSet.add(r.section || "Default"));
  const sections = Array.from(sectionSet);

  const grouped: Record<string, Resource[]> = {};
  sections.forEach((sec) => (grouped[sec] = []));
  resources.forEach((r) => grouped[r.section || "Default"].push(r));
  sections.forEach((sec) =>
    grouped[sec].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
  );

  return { sections, grouped };
}

export function StacqBoard({
  initialStacq,
  isOwner,
}: {
  initialStacq: Stacq;
  isOwner: boolean;
}) {
  const router = useRouter();

  const [sections, setSections] = useState<string[]>(
    () => parseStacq(initialStacq).sections,
  );
  const [items, setItems] = useState<Record<string, Resource[]>>(
    () => parseStacq(initialStacq).grouped,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"Section" | "Resource" | null>(
    null,
  );
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [isDndMode, setIsDndMode] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // NOTE: Instead of syncing via useEffect, the parent passes key={stacq.id}
  // so React remounts this component cleanly when the stacq changes.

  const handleAddSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    if (sections.includes(name)) {
      toast.error("Exists");
      return;
    }
    const nextSections = [...sections, name];
    setSections(nextSections);
    setItems((prev) => ({ ...prev, [name]: [] }));
    setNewSectionName("");
    await updateStacq(initialStacq.id, { section_order: nextSections });
  };

  const handleDeleteSection = async (sectionName: string) => {
    const nextSections = sections.filter((s) => s !== sectionName);
    // Move resources locally to Default
    setItems((prev) => {
      const moved = [...(prev[sectionName] || [])].map((r) => ({
        ...r,
        section: "Default",
      }));
      const newItems = { ...prev };
      newItems["Default"] = [...(newItems["Default"] || []), ...moved];
      delete newItems[sectionName];
      return newItems;
    });
    setSections(nextSections);
    const res = await deleteSection(initialStacq.id, sectionName);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Section "${sectionName}" removed`);
      router.refresh();
    }
  };

  const handleRenameSection = async (oldName: string, newName: string) => {
    if (sections.includes(newName)) {
      toast.error("Exists");
      return;
    }
    const nextSections = sections.map((s) => (s === oldName ? newName : s));
    setSections(nextSections);
    setItems((prev) => {
      const newItems = { ...prev };
      const targetItems = [...(newItems[oldName] || [])];
      targetItems.forEach((item) => (item.section = newName));
      newItems[newName] = targetItems;
      delete newItems[oldName];
      return newItems;
    });
    const res = await renameSection(initialStacq.id, oldName, newName);
    if (res.error) toast.error(res.error);
  };

  const findContainer = (id: string) => {
    if (sections.includes(id)) return id;
    for (const key of Object.keys(items)) {
      if (items[key].find((item) => item.id === id)) return key;
    }
    return null;
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveType(event.active.data.current?.type);
    if (event.active.data.current?.type === "Section") {
      setIsDndMode(true);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    if (activeType !== "Resource") return;
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);
    if (!activeContainer || !overContainer || activeContainer === overContainer)
      return;

    setItems((prev) => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];
      const activeIndex = activeItems.findIndex((i) => i.id === active.id);
      const overIndex =
        over.id in prev
          ? overItems.length + 1
          : overItems.findIndex((i) => i.id === over.id);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;
      const itemToMove = activeItems[activeIndex];
      itemToMove.section = overContainer;
      activeItems.splice(activeIndex, 1);
      overItems.splice(newIndex, 0, itemToMove);
      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);
    setIsDndMode(false);
    const { active, over } = event;
    if (!over) return;

    if (activeType === "Section") {
      const activeIndex = sections.indexOf(active.id as string);
      let overIndex = sections.indexOf(over.id as string);

      if (overIndex === -1) {
        const container = findContainer(over.id as string);
        if (container) overIndex = sections.indexOf(container);
      }

      if (activeIndex !== overIndex && overIndex !== -1) {
        const newSections = arrayMove(sections, activeIndex, overIndex);
        setSections(newSections);
        await updateStacq(initialStacq.id, { section_order: newSections });
        router.refresh();
      }
      return;
    }

    if (activeType === "Resource") {
      const activeContainer = findContainer(active.id as string);
      const overContainer = findContainer(over.id as string);
      if (!activeContainer || !overContainer) return;

      if (activeContainer === overContainer) {
        const activeIndex = items[activeContainer].findIndex(
          (i) => i.id === active.id,
        );
        const overIndex = items[overContainer].findIndex(
          (i) => i.id === over.id,
        );
        if (activeIndex !== overIndex) {
          const newContainerItems = arrayMove(
            items[activeContainer],
            activeIndex,
            overIndex,
          );
          setItems((prev) => ({
            ...prev,
            [activeContainer]: newContainerItems,
          }));
          const updates = newContainerItems.map((itm, idx) => ({
            id: itm.id,
            section: activeContainer,
            order_index: idx,
          }));
          await updateResourceOrders(updates);
          router.refresh();
        }
      } else {
        const updatesOne = items[activeContainer].map((itm, idx) => ({
          id: itm.id,
          section: activeContainer,
          order_index: idx,
        }));
        const updatesTwo = items[overContainer].map((itm, idx) => ({
          id: itm.id,
          section: overContainer,
          order_index: idx,
        }));
        await updateResourceOrders([...updatesOne, ...updatesTwo]);
        router.refresh();
      }
    }
  };

  const activeResource =
    activeType === "Resource"
      ? Object.values(items)
          .flat()
          .find((r) => r.id === activeId)
      : null;

  return (
    <div className="space-y-6 md:space-y-8 px-2 md:px-0">
      {!isOwner ? (
        <ReadonlySections sections={sections} items={items} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="space-y-6 md:space-y-8">
            <div className="relative group">
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="New section..."
                className="bg-surface border-border h-11 md:h-14 rounded-xl md:rounded-2xl pr-24 md:pr-40 text-sm md:text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSection();
                }}
              />
              <Button
                onClick={handleAddSection}
                className="absolute right-1 top-1 bottom-1 h-9 md:h-12 w-[60px] md:w-[130px] font-bold rounded-lg md:rounded-xl p-0"
              >
                <Plus className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Add Section</span>
                <span className="md:hidden">Add</span>
              </Button>
            </div>

            <SortableContext
              items={sections}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 md:space-y-8 pl-0 md:pl-14">
                {" "}
                {/* Reduced spacing when collapsed */}
                {sections.map((section) => (
                  <SortableSection
                    key={section}
                    id={section}
                    sectionName={section}
                    items={items[section] || []}
                    isOwner={isOwner}
                    onRename={handleRenameSection}
                    onDelete={handleDeleteSection}
                    isSectionDragging={activeType === "Section"}
                    availableSections={sections}
                    isCollapsed={isDndMode || collapsedSections.has(section)}
                    onToggleCollapse={() => {
                      const next = new Set(collapsedSections);
                      if (next.has(section)) next.delete(section);
                      else next.add(section);
                      setCollapsedSections(next);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeId && activeType === "Section" ? (
              <div className="bg-surface p-4 md:p-6 rounded-2xl md:rounded-3xl border border-primary shadow-2xl">
                <h2 className="text-xl md:text-2xl font-black">{activeId}</h2>
              </div>
            ) : null}
            {activeId && activeType === "Resource" && activeResource ? (
              <div className="shadow-2xl opacity-90 scale-105">
                <ResourceCard
                  resource={activeResource}
                  isOwner={true}
                  availableSections={sections}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
