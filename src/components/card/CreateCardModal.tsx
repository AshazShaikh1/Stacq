"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CreateCollectionModal } from "@/components/collection/CreateCollectionModal";
import { CardTypeSelector } from "./CardTypeSelector";
import { CardDetailsStep } from "./CardDetailsStep";
import { OptionalDetailsStep } from "@/components/collection/OptionalDetailsStep";
import { StackSelector } from "./StackSelector";
import { BecomeStackerModal } from "@/components/auth/BecomeStackerModal";
import { useToast } from "@/contexts/ToastContext";
import { trackEvent } from "@/lib/analytics";
import type { CardType, FileData, StackVisibility } from "@/types";

type Step = "type" | "details" | "optional" | "stack";

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  initialFileData?: FileData;
  initialCollectionId?: string;
}

export function CreateCardModal({
  isOpen,
  onClose,
  initialUrl,
  initialFileData,
  initialCollectionId,
}: CreateCardModalProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  /* ================= CORE STATE ================= */
  const [step, setStep] = useState<Step>("type");
  const [cardType, setCardType] = useState<CardType | null>(null);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [useUrlForImage, setUseUrlForImage] = useState(false);
  const [docsFile, setDocsFile] = useState<File | null>(null);
  const [useUrlForDoc, setUseUrlForDoc] = useState(false);

  const [visibility, setVisibility] = useState<StackVisibility>("private");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );

  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    initialCollectionId || ""
  );

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Drag states
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showBecomeStacker, setShowBecomeStacker] = useState(false);
  const [isStacker, setIsStacker] = useState(false);

  /* ================= REFS ================= */
  const titleRef = useRef("");
  const descriptionRef = useRef("");
  const metadataUrlRef = useRef("");

  /* ================= RESET (ANIMATION SAFE) ================= */
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("type");
        setCardType(null);
        setUrl("");
        setTitle("");
        setDescription("");
        setImageFile(null);
        setImagePreview(null);
        setImageUrl("");
        setDocsFile(null);
        setCoverImageFile(null);
        setCoverImagePreview(null);
        setSelectedCollectionId(initialCollectionId || "");
        setVisibility("private");
        setError("");
        setIsLoading(false);
        setIsDraggingImage(false);
        setIsDraggingDocs(false);
        setIsDraggingCover(false);
      }, 300);
    }
  }, [isOpen]);

  /* ================= ROLE ================= */
  useEffect(() => {
    if (!isOpen) return;
    const loadRole = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      setIsStacker(profile?.role === "stacker" || profile?.role === "admin");
    };
    loadRole();
  }, [isOpen]);

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (!isOpen) return;

    if (initialUrl) {
      setUrl(initialUrl);
      setCardType("link");
      setStep("details");
      fetchMetadata(initialUrl);
    }

    if (initialFileData) {
      setCardType(initialFileData.cardType);
      setStep("details");

      if (initialFileData.imageUrl) {
        setImageUrl(initialFileData.imageUrl);
        setImagePreview(initialFileData.imageUrl);
      } else if (initialFileData.data) {
        const dataUrl = initialFileData.data;
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], initialFileData!.name, {
              type: initialFileData!.type,
            });
            if (initialFileData.cardType === "image") {
              setImageFile(file);
              setImagePreview(dataUrl);
            } else {
              setDocsFile(file);
            }
          })
          .catch((err) => console.error("Error converting file:", err));
      }

      if (initialFileData.title) {
        setTitle(initialFileData.title);
        titleRef.current = initialFileData.title;
      }
      if (initialFileData.description) {
        setDescription(initialFileData.description);
        descriptionRef.current = initialFileData.description;
      }
    }
  }, [isOpen, initialUrl, initialFileData]);

  /* ================= METADATA ================= */
  const fetchMetadata = useCallback(
    async (urlToFetch: string) => {
      try {
        new URL(urlToFetch);
      } catch {
        return;
      }

      metadataUrlRef.current = urlToFetch;
      setIsFetchingMetadata(true);
      try {
        const response = await fetch("/api/cards/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlToFetch }),
        });

        if (response.ok) {
          const data = await response.json();
          if (metadataUrlRef.current === urlToFetch) {
            if (!titleRef.current.trim() && data.title) {
              setTitle(data.title);
              titleRef.current = data.title;
            }
            if (!descriptionRef.current.trim() && data.description) {
              setDescription(data.description);
              descriptionRef.current = data.description;
            }
            if (data.thumbnail_url && !coverImagePreview) {
              setCoverImagePreview(data.thumbnail_url);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
      } finally {
        setIsFetchingMetadata(false);
      }
    },
    [coverImagePreview]
  );

  useEffect(() => {
    if (isOpen && initialUrl) {
      setUrl(initialUrl);
      setCardType("link");
      setStep("details");
      titleRef.current = "";
      descriptionRef.current = "";
      fetchMetadata(initialUrl);
    }
  }, [isOpen, initialUrl, fetchMetadata]);

  /* ================= COLLECTIONS ================= */
  const fetchCollections = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const { data: rows } = await supabase
      .from("collections")
      .select("id, title, cover_image_url")
      .eq("owner_id", data.user.id)
      .order("created_at", { ascending: false });

    setCollections(rows || []);
  };

  /* ================= HELPERS ================= */
  const handleFileSelect = (file: File, type: "image" | "docs") => {
    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDocsFile(file);
    }
    setError("");
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setError("");
    }
  };

  /* ================= FLOW ================= */
  const handleDetailsNext = async () => {
    if (cardType === "link" && !url.trim()) return setError("URL is required");
    if (!title.trim()) return setError("Title is required");

    // Validation for Image
    if (cardType === "image") {
       if (useUrlForImage && !imageUrl.trim()) return setError("Image URL is required");
       if (!useUrlForImage && !imageFile) return setError("Image file is required");
    }
    // Validation for Docs
    if (cardType === "docs") {
       if (useUrlForDoc && !url.trim()) return setError("Document URL is required");
       if (!useUrlForDoc && !docsFile) return setError("Document file is required");
    }

    if (cardType === "link" && (!titleRef.current || !coverImagePreview)) {
      await fetchMetadata(url);
    }

    setError("");
    setStep("optional");
  };

  const handleOptionalNext = () => {
    if (visibility === "public" && !isStacker) {
      setShowBecomeStacker(true);
      return;
    }
    
    // IF we already have a collection (e.g. from context), skip selection
    if (initialCollectionId) {
        handleSubmit(); 
    } else {
        fetchCollections();
        setStep("stack");
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      // Safe check for user
      if (!data?.user?.id) throw new Error("Not logged in");

      // Upload Images
      let finalCardUrl = url;
      let finalThumbnailUrl = coverImagePreview || undefined;

      // Handle Image Type Logic
      if (cardType === "image") {
          if (useUrlForImage) {
             finalCardUrl = imageUrl;
             if (!finalThumbnailUrl) finalThumbnailUrl = imageUrl;
          } else if (imageFile) {
            const fileName = `cards/${data.user.id}/${Date.now()}_${imageFile.name}`;
            await supabase.storage.from("thumbnails").upload(fileName, imageFile);
            const { data: publicUrl } = supabase.storage.from("thumbnails").getPublicUrl(fileName);
            finalCardUrl = publicUrl.publicUrl;
            if (!finalThumbnailUrl) finalThumbnailUrl = publicUrl.publicUrl;
          }
      }

      // Handle Doc Type Logic
       if (cardType === "docs") {
          if (useUrlForDoc) {
             // finalCardUrl already set to url from input
          } else if (docsFile) {
             // Upload doc as file (simulated by uploading to thumbnails bucket for now)
             const fileName = `documents/${data.user.id}/${Date.now()}_${docsFile.name}`;
             await supabase.storage.from("thumbnails").upload(fileName, docsFile);
             const { data: publicUrl } = supabase.storage.from("thumbnails").getPublicUrl(fileName);
             finalCardUrl = publicUrl.publicUrl;
          }
       }

      if (coverImageFile) {
        const fileName = `covers/${data.user.id}/${Date.now()}_cover_${
          coverImageFile.name
        }`;
        await supabase.storage
          .from("thumbnails")
          .upload(fileName, coverImageFile);
        const { data: publicUrl } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(fileName);
        finalThumbnailUrl = publicUrl.publicUrl;
      }

      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          url: finalCardUrl,
          thumbnail_url: finalThumbnailUrl,
          collection_id: selectedCollectionId || undefined,
          is_public: visibility === "public",
          type: cardType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create card");
      }

      const result = await res.json();
      
      // SAFE ID ACCESS
      const createdCardId = result.card?.id || result.card_id;
      if (!createdCardId) throw new Error("Card created but ID missing");

      const eventCardType: "link" | "image" | "document" =
        cardType === "docs"
          ? "document"
          : (cardType as "link" | "image" | "document");
      
      trackEvent.addCard(
        data.user.id,
        createdCardId,
        selectedCollectionId,
        eventCardType
      );

      showSuccess("Card created");
      onClose();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="relative min-h-[420px]">
        {step === "type" && (
          <CardTypeSelector
            onSelect={(t) => {
              setCardType(t);
              setStep("details");
            }}
          />
        )}

        {step === "details" && cardType && (
          <CardDetailsStep
            cardType={cardType}
            url={url}
            onUrlChange={setUrl}
            title={title}
            onTitleChange={(v) => {
              setTitle(v);
              titleRef.current = v;
            }}
            description={description}
            onDescriptionChange={(v) => {
              setDescription(v);
              descriptionRef.current = v;
            }}
            error={error}
            isLoading={isLoading}
            onBack={() => setStep("type")}
            onNext={handleDetailsNext}
            onFetchMetadata={() => fetchMetadata(url)}
            isFetchingMetadata={isFetchingMetadata}
            imageFile={imageFile}
            imagePreview={imagePreview}
            imageUrl={imageUrl}
            onImageUrlChange={setImageUrl}
            isDraggingImage={isDraggingImage}
            onImageDragOver={(e) => {
              e.preventDefault();
              setIsDraggingImage(true);
            }}
            onImageDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingImage(false);
            }}
            onImageDrop={(e) => {
              e.preventDefault();
              setIsDraggingImage(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelect(file, "image");
            }}
            onImageChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file, "image");
            }}
            docsFile={docsFile}
            isDraggingDocs={isDraggingDocs}
            onDocsDragOver={(e) => {
              e.preventDefault();
              setIsDraggingDocs(true);
            }}
            onDocsDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingDocs(false);
            }}
            onDocsDrop={(e) => {
              e.preventDefault();
              setIsDraggingDocs(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelect(file, "docs");
            }}
            onDocsChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file, "docs");
            }}
            useUrlForImage={useUrlForImage}
            onUseUrlForImageChange={setUseUrlForImage}
            useUrlForDoc={useUrlForDoc}
            onUseUrlForDocChange={setUseUrlForDoc}
            // Not used in this step anymore, but required by props
            isPublic={visibility === "public"}
            onIsPublicChange={() => {}}
            canMakePublic={isStacker}
          />
        )}

        {step === "optional" && (
          <OptionalDetailsStep
            visibility={visibility}
            onVisibilityChange={setVisibility}
            coverImage={coverImageFile}
            coverImagePreview={coverImagePreview}
            error={error}
            isLoading={isLoading}
            onBack={() => setStep("details")}
            onSubmit={handleOptionalNext}
            isDragging={isDraggingCover}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingCover(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingCover(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingCover(false);
              const file = e.dataTransfer.files?.[0];
              if (file)
                handleCoverImageChange({ target: { files: [file] } } as any);
            }}
            onImageChange={handleCoverImageChange}
          />
        )}

        {step === "stack" && (
          <StackSelector
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelect={setSelectedCollectionId}
            onCreateNew={() => setShowCreateCollection(true)}
            onBack={() => setStep("optional")}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      <CreateCollectionModal
        isOpen={showCreateCollection}
        onClose={() => setShowCreateCollection(false)}
        fromCardCreation
        onCollectionCreated={(id) => {
          fetchCollections();
          setSelectedCollectionId(id);
          setShowCreateCollection(false);
        }}
      />

      <BecomeStackerModal
        isOpen={showBecomeStacker}
        onClose={() => setShowBecomeStacker(false)}
        onSuccess={() => {
          setIsStacker(true);
          setShowBecomeStacker(false);
          handleOptionalNext();
        }}
      />
    </Modal>
  );
}
