"use client";

import { useState } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface GeneralSectionActionsMenuProps {
  collectionId: string;
}

export function GeneralSectionActionsMenu({ collectionId }: GeneralSectionActionsMenuProps) {
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  const handleClear = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/general`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showSuccess("Uncategorized cards cleared");
      setIsClearConfirmOpen(false);
      router.refresh();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative z-10">
        <Dropdown
          items={[
            {
              label: "Convert to Section",
              onClick: () => setIsConvertOpen(true),
              icon: <Pencil className="w-4 h-4" />
            },
            {
              label: "Clear All Cards",
              onClick: () => setIsClearConfirmOpen(true),
              variant: "danger",
              icon: <Trash2 className="w-4 h-4" />
            }
          ]}
        >
          <div className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
             <MoreHorizontal className="w-5 h-5" />
          </div>
        </Dropdown>
      </div>

       {/* Convert Modal */}
       <ConvertSectionModal 
          isOpen={isConvertOpen} 
          onClose={() => setIsConvertOpen(false)} 
          collectionId={collectionId}
       />

      <ConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClear}
        title="Clear General Resources?"
        message="Are you sure you want to remove ALL uncategorized cards from this collection? This cannot be undone."
        confirmText="Clear All"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  );
}


function ConvertSectionModal({ isOpen, onClose, collectionId }: { isOpen: boolean, onClose: () => void, collectionId: string }) {
    const [title, setTitle] = useState("General Resources");
    const [isLoading, setIsLoading] = useState(false);
    const { showSuccess, showError } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`/api/collections/${collectionId}/general`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "convert", title }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            showSuccess("Section created");
            onClose();
            router.refresh();
        } catch (err: any) {
             showError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Convert to Section" size="sm">
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                     <label className="text-sm font-medium mb-1 block">Section Name</label>
                     <Input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="e.g., Introduction, Misc..."
                        autoFocus
                     />
                     <p className="text-xs text-gray-500 mt-1">
                         All uncategorized cards will be moved to this new section.
                     </p>
                 </div>
                 <div className="flex justify-end gap-3 pt-4">
                     <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                     <Button type="submit" isLoading={isLoading}>Save</Button>
                 </div>
             </form>
        </Modal>
    );
}
