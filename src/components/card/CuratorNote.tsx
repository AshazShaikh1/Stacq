import { User } from "lucide-react";
import Image from "next/image";

interface CuratorNoteProps {
  note: string;
  author?: {
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  };
  className?: string;
  variant?: "preview" | "detail";
}

export function CuratorNote({ note, author, className = "", variant = "preview" }: CuratorNoteProps) {
  if (!note) return null;

  const displayName = author?.display_name || author?.username || "Curator";
  const avatarUrl = author?.avatar_url;

  return (
    <div className={`
      relative group flex flex-col gap-2 
      bg-amber-50/80 border-l-4 border-amber-300/80 
      ${variant === "preview" ? "p-3 text-xs" : "p-4 md:p-5 text-sm md:text-base"}
      ${className}
    `}>
      {/* Note Content */}
      <div className="text-amber-950/90 leading-relaxed font-medium italic">
        &quot;{note}&quot;
      </div>
      
      {/* Attribution */}
      <div className="flex items-center gap-2 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="relative w-5 h-5 rounded-full overflow-hidden bg-amber-200 shrink-0">
          {avatarUrl ? (
             <Image 
                src={avatarUrl} 
                alt={displayName} 
                fill 
                className="object-cover"
                sizes="20px"
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-amber-700">
               <User className="w-3 h-3" />
             </div>
          )}
        </div>
        <span className="text-[10px] md:text-xs font-bold text-amber-800/70 uppercase tracking-wide">
          {displayName} says
        </span>
      </div>
    </div>
  );
}
