"use client";

import { useRef, useState } from "react";
import { Camera, LoaderCircle, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiErrorToast } from "@/lib/api";
import { cn } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/jp2"]);
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.jp2,image/jpeg,image/png,image/jp2";

type Props = {
  id: string;
  label: string;
  entityId?: string;
  onUpload: (file: File, entityId: string) => Promise<string>;
  value?: string | null;
  onChange: (url: string) => void;
  onPendingFileChange?: (file: File | null) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function ProfileImageUpload({
  id,
  label,
  entityId,
  onUpload,
  value,
  onChange,
  onPendingFileChange,
  onUploadingChange,
  disabled = false,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const preview = localPreview ?? value ?? "";

  const clearLocalPreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setLocalPreview(null);
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      toast.error("Choose a JPG, PNG, or JPEG 2000 image");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    clearLocalPreview();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    if (!entityId) {
      onPendingFileChange?.(file);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const uploadedUrl = await onUpload(file, entityId);
      onChange(uploadedUrl);
      onPendingFileChange?.(null);
      clearLocalPreview();
    } catch (error) {
      clearLocalPreview();
      apiErrorToast(error, "Failed to upload profile image");
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-sm items-center gap-4 rounded-md border bg-muted/20 p-3",
        className,
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={(event) => void handleFileChange(event.target.files?.[0])}
      />
      <div className="relative flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded border bg-background text-muted-foreground">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`${label} preview`} className="size-full object-cover" />
        ) : (
          <UserRound className="size-8" />
        )}
        {isUploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
            <LoaderCircle className="size-5 animate-spin" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 space-y-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-muted-foreground text-xs">
            {isUploading
              ? "Uploading image…"
              : preview
                ? "Portrait image selected"
                : "No image selected"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Camera />
            {preview ? "Change image" : "Choose image"}
          </Button>
          {!isUploading && preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-destructive"
              disabled={disabled}
              onClick={() => {
                clearLocalPreview();
                onPendingFileChange?.(null);
                onChange("");
              }}
            >
              <X />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}