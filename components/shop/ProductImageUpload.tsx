"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";
const MAX_SIZE_MB = 5;

interface Props {
  name?: string; // hidden input name carrying the final URL for form submission
  initialUrl?: string | null;
}

export function ProductImageUpload({ name = "image_url", initialUrl = null }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in again");
        return;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        toast.error(uploadError.message || "Upload failed");
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(publicUrlData.publicUrl);
    } catch {
      toast.error("Upload failed — please try again");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Product Image</label>
      <input type="hidden" name={name} value={url ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {url ? (
        <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <Image src={url} alt="Product preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => setUrl(null)}
            aria-label="Remove image"
            className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 shadow-card"
          >
            <X className="h-3.5 w-3.5 text-slate-600" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-500 disabled:opacity-60 dark:border-slate-600"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Tap to upload</span>
            </>
          )}
        </button>
      )}
      <p className="mt-1 text-xs text-slate-400">JPG or PNG, up to {MAX_SIZE_MB}MB.</p>
    </div>
  );
            }
