"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { trackEvent } from "@/lib/analytics";

interface CreateCardFormProps {
  initialCollectionId?: string;
  initialUrl?: string;
  onSuccess: (cardId: string) => void;
  onCancel: () => void;
  onCreateCollection?: () => void;
  isStacqer?: boolean;
  onBecomeStacqer?: () => void;
}

type CardType = "link" | "image" | "document";

export function CreateCardForm({
  initialCollectionId,
  initialUrl,
  onSuccess,
  onCancel,
  ...props
}: CreateCardFormProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps: 'type' -> 'content' -> 'settings'
  const [step, setStep] = useState<"type" | "content" | "settings">(initialUrl ? "content" : "type");
  const [type, setType] = useState<CardType>("link");

  // Data
  const [url, setUrl] = useState(initialUrl || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [collectionId, setCollectionId] = useState(initialCollectionId || "");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  
  // Files
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Metadata
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [fetchedMeta, setFetchedMeta] = useState<{ title?: string; image?: string } | null>(null);

  // Track if user has manually edited fields to prevent overwriting
  const userHasEdited = useRef({ title: false, description: false });

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionId, setSectionId] = useState("");

  // Load collections
  useEffect(() => {
    const loadCollections = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("collections")
        .select("id, title, is_public, is_hidden")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
        
      setCollections(data || []);
    };
    loadCollections();
  }, []);

  // Fetch sections when collection changes
  useEffect(() => {
    const loadSections = async () => {
      setSections([]);
      setSectionId("");
      
      if (!collectionId || collectionId === "create_new") return;

      const supabase = createClient();
      const { data } = await supabase
        .from("sections")
        .select("id, title")
        .eq("collection_id", collectionId)
        .order("order", { ascending: true });
        
      if (data && data.length > 0) {
        setSections(data);
        // Optional: Default to first section? No, let user choose or leave uncategorized.
      }
    };
    loadSections();
  }, [collectionId]);

  // Enforce Visibility Logic
  useEffect(() => {
    if (collectionId) {
      const selectedCollection = collections.find(c => c.id === collectionId);
      if (selectedCollection) {
        // If collection is NOT public (meaning private or unlisted/hidden), force card to be private.
        // Or if strictly private. The request says "private collection". 
        // Typically 'is_public' true = public. 'is_public' false = private (or unlisted if we have that distinction).
        // Let's assume !is_public = private for this constraint.
        if (!selectedCollection.is_public) {
           setVisibility("private");
        }
      }
    }
  }, [collectionId, collections]);

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "create_new") {
       if (props.onCreateCollection) {
         props.onCreateCollection();
       } else {
         // Fallback if no handler provided (shouldn't happen with updated modal)
         console.warn("No create collection handler provided");
       }
    } else {
      setCollectionId(val);
    }
  };

  // Metadata Fetcher
  const fetchMetadata = useCallback(async (targetUrl: string) => {
    try {
      new URL(targetUrl);
    } catch { return; }

    setIsFetchingMeta(true);
    try {
      const res = await fetch("/api/cards/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setFetchedMeta(data); // Saved for submission

        // Only update fields if user hasn't edited them
        if (data.title && !userHasEdited.current.title) {
           setTitle(data.title);
        }
        if (data.description && !userHasEdited.current.description) {
           setDescription(data.description);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMeta(false);
    }
  }, []); // Logic relies on refs, no need to depend on title/desc values

  // Debounced Metadata Fetch
  useEffect(() => {
    if (type === "link" && url) {
      const t = setTimeout(() => fetchMetadata(url), 800);
      return () => clearTimeout(t);
    }
  }, [url, type, fetchMetadata]);

  // File Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setMediaPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setMediaPreview(null); // Doc icon handled in render
      }
      setStep("content");
    }
  };

  // State for auto-retry
  const [pendingStacqerVerification, setPendingStacqerVerification] = useState(false);

  // Auto-submit effect
  useEffect(() => {
    if (props.isStacqer && pendingStacqerVerification) {
      submitForm();
      setPendingStacqerVerification(false);
    }
  }, [props.isStacqer, pendingStacqerVerification]);

  const submitForm = async () => {
    if (!title.trim()) return showError("Title is required");
    if (type === "link" && !url) return showError("URL is required");
    if (type !== "link" && !mediaFile) return showError("File is required");

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let finalUrl = url;
      let finalThumbnail = fetchedMeta?.image || null;

      // Upload File if needed
      if (type !== "link" && mediaFile) {
        const bucket = "thumbnails"; // Using thumbnails bucket for generic storage per existing pattern
        const path = `${type}s/${user.id}/${Date.now()}_${mediaFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, mediaFile);
          
        if (uploadError) throw new Error("Upload failed");
        
        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
        finalUrl = publicUrl.publicUrl;
        
        if (type === "image") {
          finalThumbnail = publicUrl.publicUrl;
        }
      }

      // Create Card
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          url: finalUrl,
          thumbnail_url: finalThumbnail,
          collection_id: collectionId || undefined,
          is_public: visibility === "public",
          type: type === "link" ? "link" : type === "image" ? "image" : "document",
          note: note || undefined,
          section_id: sectionId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create card");
      const result = await res.json();
      
      const createdId = result.card?.id || result.card_id;
      
      trackEvent.addCard(user.id, createdId, collectionId, type);
      
      showSuccess("Card created");
      onSuccess(createdId);
      router.refresh();

    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Stacqer status for public cards
    if (visibility === 'public' && !props.isStacqer && props.onBecomeStacqer) {
       setPendingStacqerVerification(true);
       props.onBecomeStacqer();
       return;
    }

    await submitForm();
  };

  // Render Helpers
  const renderTypeSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 text-center mb-6">What are you adding?</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "link", label: "Link", icon: "🔗" },
          { id: "image", label: "Image", icon: "🖼️" },
          { id: "document", label: "File", icon: "📄" }, 
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setType(t.id as CardType);
              if (t.id === "link") setStep("content");
              setStep("content");
            }}
            className="flex md:flex-col items-center justify-start md:justify-center p-4 md:p-6 rounded-xl border-2 border-gray-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/10 transition-all gap-4 md:gap-3"
          >
            <span className="text-2xl">{t.icon}</span>
            <span className="font-medium text-gray-700">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">
      
      {step === "type" && renderTypeSelector()}

      {step === "content" && (
        <div className="space-y-6">
          
          {/* Main Input Section */}
          <div className="bg-stone-50 rounded-2xl p-6 border border-gray-100">
             
             {/* Link Input */}
             {type === "link" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">🔗</span>
                    {isFetchingMeta && (
                      <span className="absolute right-3 top-3.5 text-xs text-emerald-600 animate-pulse">Fetching...</span>
                    )}
                  </div>
                </div>
             )}

             {/* File Input */}
             {(type === "image" || type === "document") && (
               <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {type === "image" ? "Upload Image" : "Upload File"}
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:bg-white hover:border-emerald/40 transition-all"
                  >
                     {mediaPreview ? (
                        <div className="relative h-40 w-full mx-auto rounded-lg overflow-hidden">
                          <Image src={mediaPreview} alt="Preview" fill className="object-contain" />
                        </div>
                     ) : mediaFile ? (
                        <div className="text-emerald-600 font-medium">{mediaFile.name}</div>
                     ) : (
                        <div className="text-gray-500">
                          <span className="text-2xl block mb-2">{type === "image" ? "🖼️" : "📄"}</span>
                          <span className="text-sm">Click to select {type === "image" ? "image" : "file"}</span>
                        </div>
                     )}
                     <input ref={fileInputRef} type="file" accept={type === "image" ? "image/*" : "*/*"} className="hidden" onChange={handleFileSelect} />
                  </div>
               </div>
             )}

             {/* Meta Fields */}
             <div className="space-y-4">
                {/* Link Preview (New: Ensure user sees what image was fetched) */}
                {type === "link" && fetchedMeta?.image && (
                   <div className="mb-4 relative h-32 w-full bg-stone-100 rounded-xl overflow-hidden border border-gray-200">
                      <Image 
                        src={fetchedMeta.image} 
                        alt="Link Preview" 
                        fill 
                        className="object-cover"
                        unoptimized // External URLs
                      />
                   </div>
                )}
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                   <input
                     type="text"
                     value={title}
                     onChange={(e) => {
                       setTitle(e.target.value);
                       userHasEdited.current.title = true;
                     }}
                     placeholder="Title"
                     className="w-full text-lg px-4 py-3 rounded-xl border border-gray-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all placeholder:text-gray-400"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                   <textarea
                     value={description}
                     onChange={(e) => {
                        setDescription(e.target.value);
                        userHasEdited.current.description = true;
                     }}
                     placeholder="Description (optional)"
                     rows={3}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all placeholder:text-gray-400 resize-none"
                   />
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button" 
              variant="outline"
              onClick={() => setStep("type")} 
            >
              Back
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                onClick={() => {
                   if (!title.trim()) return showError("Title is required");
                   if (type === "link" && !url) return showError("URL is required");
                   if (type !== "link" && !mediaFile) return showError("File is required");
                   setStep("settings");
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "settings" && (
        <div className="space-y-6">
           
           {/* Context Section */}
           <div className="bg-white rounded-2xl p-2 md:p-6">
             <div className="space-y-6">
                <div>
                   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Collection</label>
                   <Select
                     value={collectionId}
                     onChange={(val: string) => {
                        if (val === "create_new") {
                          if (props.onCreateCollection) props.onCreateCollection();
                        } else {
                          setCollectionId(val);
                        }
                     }}
                     options={[
                       { value: "", label: "No Collection" },
                       ...collections.map(c => ({ 
                         value: c.id, 
                         label: c.title,
                       })),
                       { value: "divider", label: "───", disabled: true },
                       { value: "create_new", label: "Create New Collection...", isAction: true, icon: <span>➕</span> }
                     ]}
                     disabled={!!initialCollectionId}
                   />
                   <p className="mt-2 text-xs text-gray-400">
                     Where should this card live? You can leave it mostly empty for the default stack.
                   </p>
                <p className="mt-2 text-xs text-gray-400">
                     Where should this card live? You can leave it mostly empty for the default stack.
                   </p>
                </div>

                {/* Section Selector (visible only if sections exist) */}
                {sections.length > 0 && (
                   <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Section (Optional)</label>
                     <Select
                       value={sectionId}
                       onChange={setSectionId}
                       options={[
                         { value: "", label: "General Resources (Uncategorized)" },
                         ...sections.map(s => ({ value: s.id, label: s.title }))
                       ]}
                     />
                   </div>
                )}

                {/* Curator Note */}
                <div>
                   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Curator Note (Optional)</label>
                   <textarea
                     value={note}
                     onChange={(e) => setNote(e.target.value)}
                     placeholder="e.g., Watch from 4:20, or Read paragraph 3..."
                     rows={2}
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all text-sm resize-none"
                   />
                </div>
                
                {/* Visibility - Conditional Disable */}
                <div>
                   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                     Visibility
                     {(collectionId && collections.find(c => c.id === collectionId && !c.is_public)) && (
                       <span className="ml-2 text-amber-600 text-[10px] normal-case font-normal">
                         (Locked by private collection)
                       </span>
                     )}
                   </label>
                   <div className={`flex bg-gray-100 rounded-lg p-1 ${
                       (collectionId && collections.find(c => c.id === collectionId && !c.is_public)) 
                       ? 'opacity-60 cursor-not-allowed' 
                       : ''
                   }`}>
                      {(['public', 'private'] as const).map(v => {
                        const isLockedPrivate = (collectionId && collections.find(c => c.id === collectionId && !c.is_public));
                        const isDisabled = isLockedPrivate;
                        
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                               if (isDisabled) return;
                               if (v === 'public' && !props.isStacqer && props.onBecomeStacqer) {
                                  props.onBecomeStacqer();
                                  return;
                               }
                               setVisibility(v);
                            }}
                            disabled={isDisabled}
                            className={`
                              flex-1 text-xs font-medium py-1.5 rounded-md transition-all 
                              ${visibility === v 
                                ? 'bg-white shadow-sm text-gray-900' 
                                : 'text-gray-500 hover:text-gray-700'
                              }
                              ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                            {v === 'public' && !props.isStacqer && (
                                <span className="ml-1 text-amber-500">★</span>
                            )}
                          </button>
                        );
                      })}
                   </div>
                </div>
             </div>
           </div>

           {/* Actions */}
           <div className="flex items-center justify-between pt-4">
             <Button 
               type="button" 
               variant="outline"
               onClick={() => setStep("content")} 
             >
               Back
             </Button>
             <div className="flex gap-3">
               <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                 Cancel
               </Button>
               <Button type="submit" variant="primary" isLoading={isLoading}>
                 Create Card
               </Button>
             </div>
           </div>
        </div>
      )}
    </form>
  );
}
