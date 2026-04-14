"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createStacq } from "@/lib/actions/stacq";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, PlusSquare, Hash, AlignLeft, Layout } from "lucide-react";
import { toast } from "sonner";
import { stacqSchema } from "@/lib/validations/schemas";
import { ZodIssue } from "zod";

export function CreateStacqModal({
  children,
}: {
  children: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  const validate = () => {
    const result = stacqSchema.safeParse({
      title,
      description,
      category,
      thumbnail,
    });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err: ZodIssue) => {
        const path = err.path[0] as string;
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const res = await createStacq(title, description, category, thumbnail);
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
    } else if (res.success) {
      toast.success("Stacq created successfully!");
      setOpen(false);
      setLoading(false);
      router.push(`/stacq/${res.slug}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />

      <DialogContent className="w-[95%] sm:max-w-2xl border-border p-5 sm:p-7 rounded-3xl sm:rounded-4xl">
        <DialogHeader className="space-y-1 mb-2">
          <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Create a Stacq
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base font-medium text-muted-foreground">
            Stack high-signal resources and share your curation with the world.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
                  Stack Title
                </label>
                <div className="relative">
                  <Layout className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Next.js Mastery"
                    data-testid="create-stacq-title"
                    className={`h-12 pl-10 bg-surface rounded-xl border-border text-sm font-semibold ${errors.title ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                </div>
                {errors.title && (
                  <p className="text-[10px] font-bold text-destructive animate-in fade-in slide-in-from-top-1">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
                  Category Tag
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Tech, Productivity"
                    data-testid="create-stacq-category"
                    className={`h-12 pl-10 bg-surface rounded-xl border-border text-sm font-semibold ${errors.category ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                </div>
                {errors.category && (
                  <p className="text-[10px] font-bold text-destructive animate-in fade-in slide-in-from-top-1">
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <ImageUpload
              value={thumbnail}
              onChange={setThumbnail}
              onRemove={() => setThumbnail("")}
              label="Stacq Thumbnail"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
              The &quot;Why&quot; (Description)
            </label>

            <div className="relative">
              <AlignLeft className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why are you putting this collection together? What's the signal?"
                data-testid="create-stacq-description"
                className={`resize-none h-24 sm:h-28 pl-10 pt-3 bg-surface rounded-xl border-border text-sm font-medium ${errors.description ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
              />
            </div>
            {errors.description && (
              <p className="text-[10px] font-bold text-destructive animate-in fade-in slide-in-from-top-1">
                {errors.description}
              </p>
            )}
          </div>

          <div className="pt-2 sm:pt-4">
            <Button
              type="submit"
              disabled={loading}
              data-testid="create-stacq-submit"
              className="btn-primary w-full h-12 sm:h-14 rounded-full font-black text-base sm:text-lg shadow-emerald shadow-lg active:scale-95 transition-transform"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-3">
                  <PlusSquare className="w-5 h-5" />
                  Launch Stacq
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
