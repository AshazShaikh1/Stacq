"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateCardModal } from "@/components/card/CreateCardModal";

interface EmptyCardsWithAddProps {
  collectionId: string;
}

export function EmptyCardsWithAdd({ collectionId }: EmptyCardsWithAddProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-stone-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <div className="text-3xl">📇</div>
        </div>
        <h3 className="text-lg font-bold text-jet-dark mb-2">
          This collection is empty
        </h3>
        <p className="text-gray-500 max-w-sm mb-6">
          start adding resources to build your stack.
        </p>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald text-white rounded-lg hover:bg-emerald-dark transition-all shadow-button hover:shadow-buttonHover font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add First Card</span>
        </button>
      </div>

      <CreateCardModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialCollectionId={collectionId}
      />
    </>
  );
}
