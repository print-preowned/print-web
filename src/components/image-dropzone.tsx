"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ImageIcon,
  Trash2,
  ImagePlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/jp2"]);

const ACCEPT_ATTR = ".jpg,.jpeg,.png,.jp2,image/jpeg,image/png,image/jp2";

export type ImageDropzoneProps = {
  id?: string;
  label?: string;
  previews: string[];
  onFilesSelect: (files: File[]) => void;
  onRemoveAt: (index: number) => void;
  showCancel?: boolean;
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
  label = "Images",
  previews,
  onFilesSelect,
  onRemoveAt,
  showCancel,
  inputRef,
  className,
}: ImageDropzoneProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const fileInputRef = inputRef ?? internalRef;
  const [dragOver, setDragOver] = useState(false);
  const previewScrollerRef = useRef<HTMLDivElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const scroller = previewScrollerRef.current;
    if (!scroller) return;

    const updateScrollEdges = () => {
      setScrollEdges({
        left: scroller.scrollLeft > 0,
        right:
          scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1,
      });
    };

    updateScrollEdges();
    const resizeObserver = new ResizeObserver(updateScrollEdges);
    resizeObserver.observe(scroller);
    if (scroller.firstElementChild)
      resizeObserver.observe(scroller.firstElementChild);
    scroller.addEventListener("scroll", updateScrollEdges, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", updateScrollEdges);
    };
  }, [previews.length]);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = Array.from(files).filter(validateImageFile);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!accepted.length) return;
    onFilesSelect(accepted);
  };

  const closeDropzone = () => {
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <span className="text-sm font-medium leading-none">{label}</span>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[200px_24px_minmax(0,1fr)] md:gap-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">Add images</p>
            {showCancel ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={closeDropzone}
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            ) : null}
          </div>
          <label
            htmlFor={id}
            className={cn(
              "block h-40 cursor-pointer rounded-lg border bg-muted/20 p-3 transition-colors hover:border-primary/60 hover:bg-primary/5",
              dragOver && "border-primary bg-primary/10",
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
            <div
              className={cn(
                "flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-3 py-5 text-center",
                dragOver ? "border-primary" : "border-muted-foreground/30",
              )}
            >
              <ImagePlus className="size-8 text-primary" />
              <div>
                <p className="text-sm font-medium">Drop images here</p>
                <p className="text-muted-foreground text-xs">
                  or click to browse
                </p>
              </div>
              <p className="text-muted-foreground text-[11px]">
                JPG, PNG, JPEG
              </p>
            </div>
          </label>
        </div>

        <div
          className={cn(
            "items-center justify-center text-muted-foreground",
            previews.length == 0 && "hidden md:flex",
          )}
          aria-hidden="true"
        >
          <ArrowRight className="size-4 rotate-90 md:rotate-0" />
        </div>

        <div
          className={cn(
            "relative flex h-40 min-w-0 self-end items-center overflow-hidden rounded-lg border border-dashed bg-muted/20",
            previews.length == 0 && "hidden md:flex",
          )}
        >
          {previews.length > 0 ? (
            <>
              <div
                ref={previewScrollerRef}
                role="region"
                aria-label="Image previews"
                tabIndex={0}
                className="h-full w-full overflow-x-auto pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ul className="flex h-full w-max items-center gap-2">
                  {previews.map((preview, index) => (
                    <li
                      key={`${preview}-${index}`}
                      className="group relative h-36 shrink-0 overflow-hidden rounded border bg-background last-of-type:mr-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={`Book image ${index + 1}`}
                        className="h-full w-auto object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-1.5 top-1.5 size-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={() => onRemoveAt(index)}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {scrollEdges.left ? (
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-start bg-gradient-to-r from-background/95 to-transparent pl-1 text-muted-foreground" />
              ) : null}
              {scrollEdges.right ? (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end gap-0.5 bg-gradient-to-l from-background/95 to-transparent pr-1 text-muted-foreground" />
              ) : null}
            </>
          ) : (
            <div className="flex w-full flex-col items-center justify-center gap-1 px-2 text-center">
              <ImageIcon className="size-5 text-muted-foreground/70" />
              <p className="text-muted-foreground text-xs">
                Selected images appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
