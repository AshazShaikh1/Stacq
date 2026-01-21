"use client";

import { cn } from "@/lib/utils";

export type FeedFilterType = 'all' | 'build' | 'play' | 'grow';

interface FeedFilterProps {
  selected: FeedFilterType;
  onChange: (filter: FeedFilterType) => void;
  className?: string;
}

const FILTERS: { id: FeedFilterType; label: string; icon?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'build', label: 'Build', icon: '🛠️' },
  { id: 'play', label: 'Play', icon: '🍿' },
  { id: 'grow', label: 'Grow', icon: '🧠' },
];

export function FeedFilter({ selected, onChange, className }: FeedFilterProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-gray-100/50 rounded-xl overflow-x-auto no-scrollbar", className)}>
      {FILTERS.map((f) => {
        const isSelected = selected === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={cn(
              "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2",
              isSelected
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            )}
          >
            {f.icon && <span>{f.icon}</span>}
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
