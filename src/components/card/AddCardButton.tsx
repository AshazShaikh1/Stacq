"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { GlobalCreateModal } from "@/components/create/GlobalCreateModal";

interface AddCardButtonProps {
  collectionId?: string;
  stackId?: string; // Legacy support
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AddCardButton({
  collectionId,
  stackId, // Legacy
  variant = "primary",
  size = "md",
  className = "",
}: AddCardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const id = collectionId || stackId;

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Variant classes
  const variantClasses = {
    primary:
      "bg-jet-dark text-white hover:bg-black shadow-button hover:shadow-buttonHover",
    outline:
      "bg-transparent border border-gray-200 text-jet-dark hover:bg-gray-50",
    ghost: "bg-transparent text-jet-dark hover:bg-gray-50",
  };

  if (!id) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`
          flex items-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-[0.98]
          ${sizeClasses[size]}
          ${variantClasses[variant] === "bg-jet-dark text-white hover:bg-black shadow-button hover:shadow-buttonHover" ? "bg-emerald text-white hover:bg-emerald-dark shadow-button hover:shadow-buttonHover" : variantClasses[variant]}
          ${className}
        `}
      >
        <Plus className="w-4 h-4" />
        <span>Add Card</span>
      </button>

      <GlobalCreateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialContext={{ type: 'card', collectionId: id }}
      />
    </>
  );
}
