"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type Pillar = 'build' | 'play' | 'grow';

interface PillarSelectorProps {
  selected: Pillar;
  onChange: (pillar: Pillar) => void;
  className?: string;
}

const PILLARS: { id: Pillar; label: string; icon: string; description: string; color: string; bg: string; border: string }[] = [
  { 
    id: 'build', 
    label: 'Build', 
    icon: '🛠️', 
    description: 'Technical content, tutorials, and tools.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200 hover:border-blue-400'
  },
  { 
    id: 'play', 
    label: 'Play', 
    icon: '🍿', 
    description: 'Entertainment, games, and leisure.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200 hover:border-purple-400'
  },
  { 
    id: 'grow', 
    label: 'Grow', 
    icon: '🧠', 
    description: 'Self-improvement, health, and philosophy.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200 hover:border-teal-400'
  },
];

export function PillarSelector({ selected, onChange, className }: PillarSelectorProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3", className)}>
      {PILLARS.map((pillar) => {
        const isSelected = selected === pillar.id;
        return (
          <button
            key={pillar.id}
            type="button"
            onClick={() => onChange(pillar.id)}
            className={cn(
              "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left h-full",
              isSelected 
                ? `${pillar.border} ${pillar.bg} ring-1 ring-offset-0 ring-${pillar.color.split('-')[1]}-400` 
                : "border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200",
              isSelected ? "border-current" : ""
            )}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-2xl" role="img" aria-label={pillar.label}>
                {pillar.icon}
              </span>
              {isSelected && (
                <div className={cn("rounded-full p-1", pillar.bg)}>
                  <Check className={cn("w-4 h-4", pillar.color)} strokeWidth={3} />
                </div>
              )}
            </div>
            
            <span className={cn("font-bold text-base mb-1 block", isSelected ? pillar.color : "text-gray-900")}>
              {pillar.label}
            </span>
            
            <span className="text-xs text-gray-500 leading-snug">
              {pillar.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
