"use client"

import React, { useState } from 'react'
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
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { updateCollection, updateResourceOrders, renameSection } from '@/lib/actions/mutations'
import { Plus, GripVertical, Edit2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResourceCard } from './resource-card'
import { EmptyState } from './empty-state'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// --- Subcomponents for DnD Contexts ---

function SortableSection({ id, sectionName, items, isOwner, onRename, isSectionDragging, availableSections }: { id: string, sectionName: string, items: any[], isOwner: boolean, onRename: (oldName: string, newName: string) => void, isSectionDragging?: boolean, availableSections: string[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(sectionName)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, data: { type: 'Section' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSave = () => {
    const val = editValue.trim()
    if (val && val !== sectionName) {
      onRename(sectionName, val)
    }
    setIsEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-surface/30 p-2 md:p-6 rounded-3xl border border-border/50 space-y-4">
      <div className="flex items-center justify-between group/header">
        <div className="flex items-center gap-2 flex-1">
          {isOwner && !isEditing && (
            <div {...attributes} {...listeners} className="touch-none p-1.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-50 group-hover/header:opacity-100 transition-opacity rounded-md hover:bg-surface-hover">
              <GripVertical className="w-5 h-5" />
            </div>
          )}

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1 pr-4">
              <Input value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }} className="h-9 font-black text-lg bg-background" autoFocus />
              <button onClick={handleSave} className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsEditing(false); setEditValue(sectionName); }} className="p-2 hover:bg-surface-hover text-muted-foreground rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h2 className="text-2xl font-black tracking-tight text-foreground px-2">{sectionName}</h2>
          )}
        </div>

        {isOwner && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 opacity-0 group-hover/header:opacity-100 transition-opacity text-muted-foreground hover:text-primary rounded-lg hover:bg-background/80"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className={`transition-all duration-300 ease-in-out origin-top ${isSectionDragging ? 'grid-rows-[0fr] opacity-0 overflow-hidden' : 'grid-rows-[1fr] opacity-100'}`}>
        <SortableContext id={id} items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className={`space-y-4 min-h-[50px] p-2 rounded-2xl bg-background/50 border border-dashed border-border/50 ${isSectionDragging ? 'min-h-0 py-0 border-transparent' : ''}`}>
            {!isSectionDragging && (
              items.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground font-medium italic">
                  Drop resources here
                </div>
              ) : (
                items.map(item => (
                  <SortableResource key={item.id} item={item} isOwner={isOwner} availableSections={availableSections} />
                ))
              )
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

function SortableResource({ item, isOwner, availableSections }: { item: any, isOwner: boolean, availableSections: string[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, data: { type: 'Resource' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    // Make sure it sits above others during drag if needed, handled mainly by DragOverlay though
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group/resource">
      {isOwner && (
        <div {...attributes} {...listeners} className="touch-none absolute -left-3 top-1/2 -translate-y-1/2 -translate-x-full p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-70 sm:opacity-0 group-hover/resource:opacity-100 transition-opacity rounded-md bg-surface border border-border flex z-10">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <ResourceCard resource={item} isOwner={isOwner} availableSections={availableSections} />
    </div>
  )
}

// --- Main Board Component ---

export function StacqBoard({ initialStacq, isOwner }: { initialStacq: any, isOwner: boolean }) {
  // Compute initial derived state
  // 1. Ensure backwards compatibility: collect all sections from resources that aren't in section_order
  const derivedSections = new Set<string>(initialStacq.section_order || []);
  const initialResources = initialStacq.resources || [];
  initialResources.forEach((r: any) => derivedSections.add(r.section || 'Default'));
  const allSectionsArray = Array.from(derivedSections);

  // 2. Group resources, sorted by order_index
  const groupedResources: Record<string, any[]> = {};
  allSectionsArray.forEach(sec => groupedResources[sec] = []);
  initialResources.forEach((r: any) => {
    groupedResources[r.section || 'Default'].push(r);
  });

  // Sort inside each section
  Object.keys(groupedResources).forEach(sec => {
    groupedResources[sec].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  });

  const [sections, setSections] = useState<string[]>(allSectionsArray)
  const [items, setItems] = useState<Record<string, any[]>>(groupedResources)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'Section' | 'Resource' | null>(null)

  const [newSectionName, setNewSectionName] = useState("")

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleAddSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    if (sections.includes(name)) {
      toast.error("A section with this name already exists");
      return;
    }

    const nextSections = [...sections, name];
    setSections(nextSections);
    setItems(prev => ({ ...prev, [name]: [] }));
    setNewSectionName("");
    // Sync
    await updateCollection(initialStacq.id, { section_order: nextSections });
  }

  const handleRenameSection = async (oldName: string, newName: string) => {
    if (sections.includes(newName)) {
      toast.error("A section with this name already exists");
      return;
    }

    // Update Local Sections
    const nextSections = sections.map(s => s === oldName ? newName : s);
    setSections(nextSections);

    // Update Local Items Dictionary
    setItems(prev => {
      const newItems = { ...prev };
      const targetItems = [...(newItems[oldName] || [])];
      targetItems.forEach(item => item.section = newName);
      newItems[newName] = targetItems;
      delete newItems[oldName];
      return newItems;
    });

    const res = await renameSection(initialStacq.id, oldName, newName);
    if (res.error) toast.error(res.error);
  }

  const findContainer = (id: string) => {
    if (sections.includes(id)) return id;
    for (const key of Object.keys(items)) {
      if (items[key].find(item => item.id === id)) return key;
    }
    return null;
  }

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setActiveType(event.active.data.current?.type)
  }

  const onDragOver = (event: DragOverEvent) => {
    if (activeType !== 'Resource') return;

    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving between containers
    setItems((prev) => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];
      const activeIndex = activeItems.findIndex(i => i.id === active.id);
      const overIndex = over.id in prev ? overItems.length + 1 : overItems.findIndex(i => i.id === over.id);

      let newIndex = overIndex >= 0 ? overIndex : overItems.length;

      const itemToMove = activeItems[activeIndex];
      itemToMove.section = overContainer; // update local pointer

      activeItems.splice(activeIndex, 1);
      overItems.splice(newIndex, 0, itemToMove);

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  }

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    setActiveType(null)

    const { active, over } = event;
    if (!over) return;

    if (activeType === 'Section') {
      const activeIndex = sections.indexOf(active.id as string);
      const overIndex = sections.indexOf(over.id as string);
      if (activeIndex !== overIndex) {
        const newSections = arrayMove(sections, activeIndex, overIndex);
        setSections(newSections);
        // Sync
        await updateCollection(initialStacq.id, { section_order: newSections });
      }
      return;
    }

    if (activeType === 'Resource') {
      const activeContainer = findContainer(active.id as string);
      const overContainer = findContainer(over.id as string);

      if (!activeContainer || !overContainer) return;

      if (activeContainer === overContainer) {
        const activeIndex = items[activeContainer].findIndex(i => i.id === active.id);
        const overIndex = items[overContainer].findIndex(i => i.id === over.id);

        if (activeIndex !== overIndex) {
          const newContainerItems = arrayMove(items[activeContainer], activeIndex, overIndex);
          setItems(prev => ({ ...prev, [activeContainer]: newContainerItems }));

          // Sync bulk for this container
          const updates = newContainerItems.map((itm, idx) => ({
            id: itm.id,
            section: activeContainer,
            order_index: idx
          }));
          await updateResourceOrders(updates);
        }
      } else {
        // It was handled securely in DragOver and dropped in a new container.
        // But we need to sync BOTH containers' indexes to the backend to be safe.
        const updatesOne = items[activeContainer].map((itm, idx) => ({ id: itm.id, section: activeContainer, order_index: idx }));
        const updatesTwo = items[overContainer].map((itm, idx) => ({ id: itm.id, section: overContainer, order_index: idx }));
        await updateResourceOrders([...updatesOne, ...updatesTwo]);
      }
    }
  }

  // Find the mocked active resource strictly for DragOverlay matching
  const activeResource = activeType === 'Resource'
    ? Object.values(items).flat().find(r => r.id === activeId)
    : null;

  return (
    <div className="space-y-8">
      {!isOwner ? (
        // Visitor View (Static Read-Only List)
        <div className="space-y-10 pt-2">
          {sections.length > 0 && items ? (
            sections.map((section) => {
              if (items[section]?.length === 0) return null; // Hide empty sections for visitors
              return (
                <div key={section} className="space-y-6">
                  {section !== "Default" && (
                    <h2 className="text-2xl font-black tracking-tight text-foreground border-b border-border pb-2 inline-block pr-6">{section}</h2>
                  )}
                  <div className="space-y-6">
                    {items[section].map((item: any) => (
                      <ResourceCard key={item.id} resource={item} isOwner={false} />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyState />
          )}
        </div>
      ) : (
        // Curator View (Interactive Drag & Drop Board)
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="space-y-8">
            {/* Horizontal adding utility */}
            <div className="relative">
              <Input
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                placeholder="New section name... (e.g. Must Reads)"
                className="bg-surface border-border h-14 rounded-2xl pr-32 sm:pr-40 text-base"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection() }}
              />
              <Button onClick={handleAddSection} className="absolute right-1 top-1 bottom-1 h-12 w-[80px] sm:w-[130px] font-bold rounded-xl whitespace-nowrap p-0 sm:font-bold">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Section</span>
                <span className="sm:hidden ml-1">Add</span>
              </Button>
            </div>

            <SortableContext items={sections} strategy={verticalListSortingStrategy}>
              <div className="space-y-10 pl-6 sm:pl-10"> {/* Left padding reserves space for drag handles */}
                {sections.map(section => (
                  <SortableSection key={section} id={section} sectionName={section} items={items[section] || []} isOwner={isOwner} onRename={handleRenameSection} isSectionDragging={activeType === 'Section'} availableSections={sections} />
                ))}
              </div>
            </SortableContext>

          </div>

          <DragOverlay dropAnimation={null}>
            {activeId && activeType === 'Section' ? (
              <div className="bg-surface/90 backdrop-blur pb-6 p-6 rounded-3xl border border-primary shadow-2xl opacity-80">
                <h2 className="text-2xl font-black">{activeId}</h2>
              </div>
            ) : null}
            {activeId && activeType === 'Resource' && activeResource ? (
              <div className="shadow-2xl opacity-90 scale-105 rotate-1">
                <ResourceCard resource={activeResource} isOwner={true} availableSections={sections} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
