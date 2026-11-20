"use client";

import { useId, useState } from "react";
import { Camera, ImagePlus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { downscaleImage } from "@/lib/downscale-image";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { MAX_OFFER_PHOTOS, uploadOfferPhotoToStaging } from "@/app/seller/lib/api/inventory";

const UPLOADABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Photos of the seller's own copy, uploaded when the offer is saved. */
export function useOfferPhotos(initial: string[] = []) {
  const photos = useImageUpload({
    initialPreviews: initial,
    fallback: null,
    maxItems: MAX_OFFER_PHOTOS,
    upload: uploadOfferPhotoToStaging,
  });
  const [uploading, setUploading] = useState(false);

  /** Uploads new photos and returns every URL in order, or null if an upload failed. */
  async function resolve(): Promise<string[] | null> {
    setUploading(true);
    try {
      return await photos.resolveValues();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photos");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { ...photos, uploading, resolve };
}

export type OfferPhotosState = ReturnType<typeof useOfferPhotos>;

export function OfferPhotos({ photos }: { photos: OfferPhotosState }) {
  const id = useId();
  const [preparing, setPreparing] = useState(false);
  const busy = preparing || photos.uploading;
  const full = photos.items.length >= MAX_OFFER_PHOTOS;

  async function addFiles(list: FileList | null, input: HTMLInputElement) {
    const files = Array.from(list ?? []);
    input.value = "";
    if (!files.length) return;
    setPreparing(true);
    try {
      const prepared = await Promise.all(files.map((file) => downscaleImage(file)));
      const accepted = prepared.filter((file) => UPLOADABLE_TYPES.has(file.type));
      if (accepted.length < prepared.length) {
        toast.error("Some photos couldn't be read. Use JPG, PNG or WebP.");
      }
      photos.onFilesSelect(accepted);
    } finally {
      setPreparing(false);
    }
  }

  const tileClassName =
    "relative aspect-[3/4] overflow-hidden rounded-md border bg-muted/30";
  const addTileClassName = cn(
    tileClassName,
    "flex cursor-pointer flex-col items-center justify-center gap-1 border-dashed text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground",
    busy && "pointer-events-none opacity-50",
  );

  return (
    <div className="space-y-2 relative">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={`${id}-files`}>Photos of this copy</Label>
        <span className="text-muted-foreground text-xs tabular-nums">
          {photos.items.length}/{MAX_OFFER_PHOTOS}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        Show the cover, spine and any wear. Buyers see the main photo first.
      </p>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.previews.map((preview, index) => (
          <li key={photos.items[index].id} className={tileClassName}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={`Photo ${index + 1}`} className="size-full object-cover" />
            {index === 0 ? (
              <span className="bg-background/90 absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                Main
              </span>
            ) : (
              <button
                type="button"
                className="bg-background/90 hover:bg-background absolute bottom-1 left-1 rounded p-1"
                onClick={() => photos.moveToFront(index)}
                disabled={busy}
                aria-label={`Make photo ${index + 1} the main photo`}
              >
                <Star className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              className="bg-background/90 hover:bg-background absolute top-1 right-1 rounded p-1"
              onClick={() => photos.removeAt(index)}
              disabled={busy}
              aria-label={`Remove photo ${index + 1}`}
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        {!full ? (
          <>
            {/* Desktop browsers ignore capture, so the camera tile only shows on touch screens. */}
            <li className="pointer-fine:hidden">
              <label htmlFor={`${id}-camera`} className={addTileClassName}>
                <Camera className="size-5" aria-hidden />
                Take photo
              </label>
            </li>
            <li>
              <label htmlFor={`${id}-files`} className={addTileClassName}>
                <ImagePlus className="size-5" aria-hidden />
                {preparing ? "Preparing…" : "Choose"}
              </label>
            </li>
          </>
        ) : null}
      </ul>

      <input
        id={`${id}-camera`}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={busy || full}
        onChange={(event) => void addFiles(event.target.files, event.currentTarget)}
      />
      <input
        id={`${id}-files`}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={busy || full}
        onChange={(event) => void addFiles(event.target.files, event.currentTarget)}
      />
    </div>
  );
}
