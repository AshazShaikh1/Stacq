"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditSectionModal } from "./EditSectionModal";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

interface SectionActionsMenuProps {
  section: {
    id: string;
    title: string;
  };
}

export function SectionActionsMenu({ section }: SectionActionsMenuProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sections/${section.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete section");
      }

      showSuccess("Section deleted");
      router.refresh();
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      showError("Failed to delete section");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 overflow-hidden">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDeleteConfirmOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      <EditSectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        section={section}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Section"
        message="Are you sure you want to delete this section? All cards in this section will be moved to 'General Resources'."
        confirmText="Delete Section"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
