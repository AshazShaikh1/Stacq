"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label = "Thumbnail",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("thumbnails").getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Image uploaded!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      console.error("Upload error:", message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold text-foreground block">
        {label} (Optional)
      </label>

      {value ? (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-border group bg-surface">
          <Image src={value} alt="Thumbnail" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition-transform"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="bg-destructive text-destructive-foreground p-1.5 rounded-full hover:scale-105 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-4 gap-2 group"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">Select an image</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
