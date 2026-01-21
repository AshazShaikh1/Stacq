"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { RelatedCollectionsInput } from "@/components/collection/RelatedCollectionsInput";
import { PillarSelector, Pillar } from "@/components/create/PillarSelector";

interface CreateCollectionFormProps {
  onSuccess: (collectionId: string) => void;
  onCancel: () => void;
  isStacqer?: boolean;
  onBecomeStacqer?: () => void;
}

export function CreateCollectionForm({ onSuccess, onCancel, isStacqer, onBecomeStacqer }: CreateCollectionFormProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<'details' | 'settings'>('details');
  const [pillar, setPillar] = useState<Pillar>('build');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("public");
  const [relatedCollections, setRelatedCollections] = useState<string[]>([]);
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  // Handlers
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showError("Please select an image file");
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // State for auto-retry
  const [pendingStacqerVerification, setPendingStacqerVerification] = useState(false);

  // Auto-submit effect
  useEffect(() => {
    if (isStacqer && pendingStacqerVerification) {
      submitForm();
      setPendingStacqerVerification(false);
    }
  }, [isStacqer, pendingStacqerVerification]);

  const submitForm = async () => {
    if (!title.trim()) return showError("Please enter a title");

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload Image if present
      let coverImageUrl = null;
      if (coverImage) {
        const ext = coverImage.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("cover-images")
          .upload(fileName, coverImage);

        if (uploadError) throw new Error("Failed to upload image");
        
        const { data: urlData } = supabase.storage
          .from("cover-images")
          .getPublicUrl(fileName);
        coverImageUrl = urlData.publicUrl;
      }

      // 2. Create Collection
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description: description || null,
          tags,
          is_public: visibility === "public",
          is_hidden: visibility === "unlisted",
          cover_image_url: coverImageUrl,
          related_collections: relatedCollections,
          pillar,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create collection");
      }

      const result = await res.json();
      showSuccess("Collection created");
      onSuccess(result.id);
      
      router.refresh();
      
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Stacqer status for public collections
    if (visibility === 'public' && !isStacqer && onBecomeStacqer) {
       setPendingStacqerVerification(true);
       onBecomeStacqer();
       return;
    }

    await submitForm();
  };

  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">
      
      {/* 1. Identity Section */}
      {step === 'details' && (
        <div className="space-y-6">
          
          {/* Pillar Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What kind of collection is this?
            </label>
            <PillarSelector selected={pillar} onChange={setPillar} />
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name your collection
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design Inspiration, Q4 Goals..."
              className="w-full text-lg px-4 py-3 rounded-xl border border-gray-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection about?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="min-h-[46px] w-full px-3 py-2 rounded-xl border border-gray-200 bg-stone-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald/20 focus-within:border-emerald transition-all flex flex-wrap gap-2">
                 {tags.map(tag => (
                   <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                   </span>
                 ))}
                 <input
                   type="text"
                   value={tagInput}
                   onChange={(e) => setTagInput(e.target.value)}
                   onKeyDown={handleTagKeyDown}
                   placeholder={tags.length === 0 ? "Type tag & enter..." : ""}
                   className="flex-1 bg-transparent border-none outline-none text-sm min-w-[100px] h-6 placeholder:text-gray-400"
                 />
              </div>
           </div>

           <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="primary" 
              onClick={() => {
                if (!title.trim()) return showError("Title is required");
                setStep('settings');
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* 2. Visuals & Settings */}
      {step === 'settings' && (
      <div className="space-y-6">
        
        {/* Cover Image */}
        <div className="space-y-2">
           <label className="block text-sm font-medium text-gray-700">Cover Image</label>
             <div 
               onClick={() => fileInputRef.current?.click()}
               className={`
                 relative h-36 w-full rounded-xl border-2 border-dashed border-gray-200 
                 bg-stone-50 hover:bg-stone-100 hover:border-emerald/30 
                 cursor-pointer overflow-hidden transition-all group flex items-center justify-center
               `}
             >
             {coverPreview ? (
               <Image 
                 src={coverPreview} 
                 alt="Cover" 
                 fill 
                 className="object-cover" 
               />
             ) : (
               <div className="text-center p-4">
                 <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-emerald group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <p className="text-xs text-gray-500 font-medium">Click to upload</p>
               </div>
             )}
             <input 
               ref={fileInputRef} 
               type="file" 
               accept="image/*" 
               className="hidden" 
               onChange={handleImageSelect}
             />
           </div>
        </div>

        {/* Visibility */}
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="flex gap-2">
              {(['public', 'private'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (opt === 'public' && !isStacqer && onBecomeStacqer) {
                      onBecomeStacqer();
                      return;
                    }
                    setVisibility(opt);
                  }}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all
                    ${visibility === opt 
                      ? 'border-emerald bg-emerald/5 text-emerald-700' 
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  {opt === 'public' && !isStacqer && (
                     <span className="ml-2 text-xs text-amber-500">★</span>
                  )}
                </button>
              ))}
            </div>
        </div>

        {/* Related Collections */}
        <RelatedCollectionsInput 
          onChange={setRelatedCollections} 
        />

        {/* Actions */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setStep('details')}
          >
            Back
          </Button>
          
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isLoading}
          >
            Create Collection
          </Button>
        </div>
      </div>
      )}
    </form>
  );
}
