"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface EditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: {
    id: string;
    title: string;
  };
}

export function EditSectionModal({ isOpen, onClose, section }: EditSectionModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(section.title);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(section.title);
      setError("");
    }
  }, [isOpen, section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === section.title) {
      onClose();
      return;
    }
    
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update section");
      }

      setIsLoading(false);
      onClose();
      router.refresh();
      window.dispatchEvent(new CustomEvent("section-updated", { detail: { sectionId: section.id, newTitle: title } }));

    } catch (err: any) {
      setError(err.message || "Failed to update section");
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Section" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Section Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isLoading}
          autoFocus
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-small text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
