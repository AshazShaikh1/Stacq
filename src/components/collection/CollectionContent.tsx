"use client";

import { useState, useEffect, useRef, memo } from "react";
import { Reorder, motion, useDragControls } from "framer-motion"; // Keep for sections
import { Accordion } from "@/components/ui/Accordion";
import { FeedGrid } from "@/components/feed/FeedGrid";
import { SectionActionsMenu } from "@/components/collection/SectionActionsMenu";

import { GripVertical } from "lucide-react";
import { CardPreview } from "@/components/card/CardPreview";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  TouchSensor,
  defaultDropAnimationSideEffects, 
  DropAnimation,
  useDroppable,
  closestCorners,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CollectionContentProps {
  collectionId: string;
  initialSections: any[];
  initialCards: any[];
  isOwner: boolean;
  relatedCollections: any[];
}

export function CollectionContent({
  collectionId,
  initialSections,
  initialCards,
  isOwner,
  relatedCollections,
}: CollectionContentProps) {


  /* Sync state with props on router.refresh() */
  useEffect(() => {
      setCards(initialCards);
  }, [initialCards]);

  useEffect(() => {
     // Re-run initialization for sections to catch new ones from DB
      const hasUncategorized = initialCards.some(c => !c.sectionId);
      const alreadyHasUncategorized = initialSections.some(s => s.id === 'uncategorized');
      
      let newSections = initialSections;
      if (hasUncategorized && !alreadyHasUncategorized) {
          newSections = [...initialSections, { id: 'uncategorized', title: 'Default' }];
      }
      setSections(newSections);
  }, [initialSections, initialCards]);

  // Group cards derivation
  // We need to keep this stable or memoized if used in render loop heavily
  // Group cards derivation
  const groupCards = (currentCards: any[], currentSections: any[]) => {
    const grouped: Record<string, any[]> = {};
    // Initialize for all sections including potentially 'uncategorized'
    currentSections.forEach(s => grouped[s.id] = []);
    
    const uncategorizedArgs: any[] = [];

    currentCards.forEach(card => {
      if (card.sectionId && grouped[card.sectionId]) {
        grouped[card.sectionId].push(card);
      } else {
        uncategorizedArgs.push(card);
      }
    });

    // If we have uncategorized cards, place them in 'uncategorized' key if it exists in sections, 
    // or keep them separate? 
    // We want them accessible via grouped['uncategorized'] if we treat it as a section.
    if (uncategorizedArgs.length > 0) {
        grouped['uncategorized'] = uncategorizedArgs;
    }

    // Sort
    Object.keys(grouped).forEach(k => {
      grouped[k].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    
    return { grouped, uncategorized: uncategorizedArgs };
  };

  const [sections, setSections] = useState(() => {
      // Inject virtual 'Default' section if we have uncategorized cards 
      // AND we don't already have it in the list (though DB wont have it).
      const hasUncategorized = initialCards.some(c => !c.sectionId);
      const alreadyHasUncategorized = initialSections.some(s => s.id === 'uncategorized');
      
      if (hasUncategorized && !alreadyHasUncategorized) {
          return [...initialSections, { id: 'uncategorized', title: 'Default' }];
      }
      return initialSections;
  });

  const [cards, setCards] = useState(initialCards);
  const [groupedCards, setGroupedCards] = useState(groupCards(initialCards, sections));
  
  useEffect(() => {
    setGroupedCards(groupCards(cards, sections));
  }, [cards, sections]);

  // Section Reorder (Framer Motion - 1D List)
  const handleSectionReorder = async (newOrder: any[]) => {
    setSections(newOrder);
    if (!isOwner) return;
    try {
      // Filter out virtual 'uncategorized' section from API update
      const validSections = newOrder.filter(s => s.id !== 'uncategorized');
      
      await fetch(`/api/collections/${collectionId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sections',
          items: validSections.map((s) => {
              // We need to find the index in the FULL newOrder to assume correct relative order?
              // Or just their order in the filtered list?
              // Use their actual current index in the newOrder list to preserve gaps if any, 
              // or just compact them. 
              // Compacting is safer for DB.
              return { id: s.id, order: validSections.indexOf(s) };
          })
        }),
      });
    } catch (error) {
      console.error("Failed to reorder sections:", error);
    }
  };

  // Card Reorder (dnd-kit - 2D Grid with Multiple Containers)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    // Identify container of active item and over item
    // 'active' is always a card ID.
    // 'over' can be a card ID or a section ID (container).
    
    // Helper to find container
    const findContainer = (id: string) => {
      if (id === 'uncategorized' || sections.some(s => s.id === id)) {
        return id;
      }
      
      // If it's a card, find its section
      const card = cards.find(c => c.id === id);
      if (card) {
        return card.sectionId || 'uncategorized';
      }
      
      return null;
    };

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Move logic
    // We update 'cards' state by changing the sectionId of the active card
    setCards((prevCards) => {
       const activeIndex = prevCards.findIndex(c => c.id === active.id);
       const overIndex = prevCards.findIndex(c => c.id === over.id);

       // New section ID
       let newSectionId = overContainer === 'uncategorized' ? null : overContainer;

       // If over a container (empty section), just move it to that section
       // If over a card, we can also calculate index, but arrayMove handles sort.
       // Here we just want to switch containers. Sorting happens if we use arrayMove.
       // Actually, onDragOver for dnd-kit usually does arrayMove if containers match?
       // No, if containers DIFFER, we move item to new container.
       
       const newCards = [...prevCards];
       const card = { ...newCards[activeIndex] };
       card.sectionId = newSectionId;
       
       // Optimization: If we just update sectionId, it appends to the end of that section locally (in group function) 
       // unless we also change its 'order'.
       // But 'order' is relative to section. 
       // dnd-kit's SortableContext expects items in specific order.
       // We should try to insert it at the correct visual position?
       // For now, let's just switch sectionId. The user can then reorder within the section if they want specific slot.
       // Better: If dropping over a specific card, insert before/after.
       
       newCards[activeIndex] = card;
       return newCards;
    });
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    const activeCardId = active.id;
    setActiveId(null);
    
    // Determine final container and order
    const findContainer = (id: string) => {
         if (id === 'uncategorized' || sections.some(s => s.id === id)) return id;
         const card = cards.find(c => c.id === id);
         return card ? (card.sectionId || 'uncategorized') : null;
    };

    const activeContainer = findContainer(active.id);
    const overContainer = over ? findContainer(over.id) : null;

    if (activeContainer && overContainer && activeContainer === overContainer) {
         // Same container reorder
         const activeIndex = groupedCards.grouped[activeContainer]?.findIndex(c => c.id === active.id) ?? groupedCards.uncategorized.findIndex(c => c.id === active.id);
         const overIndex = groupedCards.grouped[overContainer]?.findIndex(c => c.id === over.id) ?? groupedCards.uncategorized.findIndex(c => c.id === over.id);

         if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
             // Calculate new order
             const containerCards = activeContainer === 'uncategorized' ? groupedCards.uncategorized : groupedCards.grouped[activeContainer];
             const newOrder = arrayMove(containerCards, activeIndex, overIndex);
             
             // Sync to main 'cards' state
             const updatedSectionCards = newOrder.map((c, i) => ({ ...c, order: i }));
             
             const otherCards = cards.filter(c => {
                  const cSec = c.sectionId || 'uncategorized';
                  return cSec !== activeContainer;
             });
             
             const allCards = [...otherCards, ...updatedSectionCards];
             setCards(allCards);

             if (isOwner) {
                 await fetch(`/api/collections/${collectionId}/reorder`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'cards',
                        items: updatedSectionCards.map((c) => ({ 
                            id: c.id,
                            order: c.order, 
                            section_id: activeContainer === 'uncategorized' ? null : activeContainer 
                        }))
                    }),
                 });
             }
         } else if (activeIndex === overIndex && activeIndex !== -1) {
            // Case where index didn't change, BUT section might have changed (inter-section drop)
            // onDragOver already updated the state sectionId, so activeContainer is the NEW container.
            // We need to compare with the ORIGINAL sectionId from active.data.current
            const originalSectionId = active.data?.current?.item?.sectionId || 'uncategorized';
            
            // If original section differs from current activeContainer, we MUST save.
            if (originalSectionId !== activeContainer) {
                 const containerCards = activeContainer === 'uncategorized' ? groupedCards.uncategorized : groupedCards.grouped[activeContainer];
                 // Re-normalize order just in case
                 const updatedSectionCards = containerCards.map((c, i) => ({ ...c, order: i }));
                 
                 if (isOwner) {
                     await fetch(`/api/collections/${collectionId}/reorder`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'cards',
                            items: updatedSectionCards.map((c) => ({ 
                                id: c.id,
                                order: c.order, 
                                section_id: activeContainer === 'uncategorized' ? null : activeContainer 
                            }))
                        }),
                     });
                 }
            }
         }
    } else {
        // Different container (already mostly handled by onDragOver for state)
        // Ensure final state is persisted (sectionId change)
        // If onDragOver updated state, checking activeContainer might return the NEW container.
        // Yes, handleDragOver updates 'cards', so activeContainer will be the NEW one.
        // We just need to persist the order in that new container.
        
        // Wait, onDragOver changes 'sectionId' but not 'order'. 
        // We should recalculate order for the destination container.
        
        if (activeContainer) {
            const containerCards = activeContainer === 'uncategorized' ? groupedCards.uncategorized : groupedCards.grouped[activeContainer];
            // Update order for all cards in this container
            const updatedSectionCards = containerCards.map((c, i) => ({ ...c, order: i }));
            
            // Persist
             if (isOwner) {
                 await fetch(`/api/collections/${collectionId}/reorder`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'cards',
                        items: updatedSectionCards.map((c) => ({ 
                            id: c.id,
                            order: c.order, 
                            section_id: activeContainer === 'uncategorized' ? null : activeContainer 
                        }))
                    }),
                 });
             }
        }
    }
  };
  
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.5' },
      },
    }),
  };

  // Custom collision detection to handle empty sections better
  // If pointer is over a Section DropZone but not over any card, we want to drop into that section.
   const customCollisionDetection = (args: any) => {
      // Prioritize closestCenter for smoother grid interactions
      return closestCenter(args);
   };

  return (
     <div className="space-y-6">
       <DndContext 
            id="collection-dnd-context"
            sensors={sensors} 
            collisionDetection={customCollisionDetection} 
            onDragStart={handleDragStart} 
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
       >
           <Reorder.Group axis="y" values={sections} onReorder={handleSectionReorder} className="space-y-6">
              {sections.map((section) => (
                 <DraggableSection 
                    key={section.id} 
                    section={section} 
                    isOwner={isOwner} 
                    groupedCards={groupedCards}
                 />
              ))}
           </Reorder.Group>

           {/* Uncategorized */}
           {/* If we allow dragging TO uncategorized, we need a droppable for it too. */}
           {/* Usually user might want to drag OUT of uncategorized to sections. 
               Dragging TO uncategorized is less common but valid.
           */}
            {/* General Resources / Uncategorized area is now integrated into the sections list as 'Default' */}
           
           <DragOverlay dropAnimation={dropAnimation}>
              {activeId ? (
                 <CardPreviewOverlay item={cards.find(c => c.id === activeId)} />
              ) : null}
           </DragOverlay>
       </DndContext>
       
       {relatedCollections.length > 0 && (
          <div className="mt-16 border-t border-gray-100 pt-12">
             <h2 className="text-xl font-bold text-gray-900 mb-6">Related Collections</h2>
             <FeedGrid collections={relatedCollections} />
          </div>
       )}
     </div>
  );
}

function DraggableSection({ section, isOwner, groupedCards }: { section: any, isOwner: boolean, groupedCards: any }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item 
            value={section} 
            dragListener={false} 
            dragControls={dragControls}
            layout
        >
             <Accordion 
               title={`${section.title} (${groupedCards.grouped[section.id]?.length || 0})`}
               defaultOpen={true}
               rightElement={isOwner ? (
                    <div className="flex items-center gap-2">
                       <SectionActionsMenu section={section} />
                       <div 
                           className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 touch-none"
                           onPointerDown={(e) => dragControls.start(e)}
                       >
                          <GripVertical className="w-5 h-5" />
                       </div>
                    </div>
                ) : undefined}
             >
                {isOwner ? (
                    // Droppable zone for the section
                    <SectionDroppable id={section.id} items={groupedCards.grouped[section.id] || []}>
                        <SortableContext items={groupedCards.grouped[section.id] || []} strategy={rectSortingStrategy}>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[100px]">
                              {(groupedCards.grouped[section.id] || []).map((card: any) => (
                                 <SortableCard key={card.id} item={card} />
                              ))}
                              {/* Empty state placeholder if needed, but min-h helps */}
                              {(!groupedCards.grouped[section.id]?.length) && (
                                  <div className="col-span-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                                      Drop cards here
                                  </div>
                              )}
                           </div>
                        </SortableContext>
                    </SectionDroppable>
                ) : (
                   <FeedGrid items={groupedCards.grouped[section.id] || []} />
                )}
             </Accordion>
        </Reorder.Item>
    );
}

// Wrapper for Droppable properties (associating a container ID with the area)
function SectionDroppable({ id, items, children }: { id: string; items: any[]; children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
        id: id,
        data: { type: 'container', items } // Metadata for collision detection if needed
    });
    return (
        <div ref={setNodeRef} className="h-full">
            {children}
        </div>
    );
}

const SortableCard = memo(function SortableCard({ item }: { item: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { item } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const cardData = {
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail_url: item.thumbnail_url,
        canonical_url: item.canonical_url,
        domain: item.domain,
        created_by: item.created_by,
        metadata: item.metadata || {},
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group h-full">
         <div 
             {...attributes} 
             {...listeners} 
             className="absolute top-2 left-2 z-50 cursor-grab active:cursor-grabbing p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur rounded-md text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-none"
             title="Drag to reorder"
         >
             <GripVertical className="w-4 h-4" />
         </div>
         <CardPreview card={cardData} hideHoverButtons={false} />
    </div>
  );
}, (prev: { item: any }, next: { item: any }) => {
    return prev.item.id === next.item.id && prev.item.title === next.item.title && prev.item.description === next.item.description; 
});

function CardPreviewOverlay({ item }: { item: any }) {
  if (!item) return null;
   const cardData = {
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail_url: item.thumbnail_url,
        canonical_url: item.canonical_url,
        domain: item.domain,
        created_by: item.created_by,
        metadata: item.metadata || {},
  };
  return (
    <div className="opacity-90 scale-105 cursor-grabbing">
       <CardPreview card={cardData} hideHoverButtons={true} />
    </div>
  );
}
