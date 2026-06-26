"use client";

import { useRef, useState } from "react";
import { ImageIcon, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/jp2",
]);

const ACCEPT_ATTR = ".jpg,.jpeg,.png,.jp2,image/jpeg,image/png,image/jp2";

export type ImageDropzoneProps = {
  id?: string;
  label?: string;
  preview: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
};

function validateImageFile(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) return true;
  toast.error("Supports JPG, JPEG2000, and PNG only");
  return false;
}

export function ImageDropzone({
  id = "image-dropzone",
  label = "Cover image",
  preview,
  onFileSelect,
  onClear,
  inputRef,
  className,
}: ImageDropzoneProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const fileInputRef = inputRef ?? internalRef;
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !validateImageFile(file)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    onFileSelect(file);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {preview ? (
        <div className="space-y-2">
          <span className="text-sm font-medium leading-none">{label}</span>
          <div className="relative overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Cover preview"
            className="aspect-[2/3] max-h-48 w-full object-contain"
          />
          <div className="absolute right-2 bottom-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="size-8 shadow-sm cursor-pointer"
              onClick={openFilePicker}
              aria-label="Replace image"
            >
              <ImagePlus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="size-8 shadow-sm cursor-pointer"
              onClick={onClear}
              aria-label="Remove image"
            >
              <Trash2 className="size-4" color="red" />
            </Button>
          </div>
        </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "block cursor-pointer rounded-lg border p-4 transition-colors",
            dragOver && "border-primary bg-primary/5",
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <span className="mb-2 block text-sm font-medium leading-none">
            {label}
          </span>
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-6 py-10 text-center",
              dragOver ? "border-primary" : "border-muted-foreground/30",
            )}
          >
            <ImageIcon className="text-primary size-10 stroke-[1.25]" />
            <p className="text-sm">
              Drop your image here, or{" "}
              <span className="text-primary font-medium underline-offset-2 hover:underline">
                browse
              </span>
            </p>
            <p className="text-muted-foreground text-xs">
              Supports: JPG, JPEG2000, PNG
            </p>
          </div>
        </label>
      )}
    </div>
  );
}
