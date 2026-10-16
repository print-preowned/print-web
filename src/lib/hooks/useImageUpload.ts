"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadBookCoverToStaging } from "@/lib/api/book-image";

export const DEFAULT_IMAGE_PLACEHOLDER = "https://placehold.co/400";

function revokeBlobUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export type ImageUploadItem = {
  id: string;
  preview: string;
  file?: File;
  url?: string;
};

export type UseImageUploadOptions = {
  initialPreviews?: string[];
  fallback?: string | null;
  maxItems?: number;
};

export function useImageUpload({
  initialPreviews = [],
  fallback = DEFAULT_IMAGE_PLACEHOLDER,
  maxItems,
}: UseImageUploadOptions = {}) {
  const idPrefix = useId();
  const nextId = useRef(0);
  const makeId = () => `${idPrefix}-${nextId.current++}`;

  const [items, setItems] = useState<ImageUploadItem[]>(() =>
    initialPreviews.map((url) => ({
      id: `${idPrefix}-init-${url}`,
      preview: url,
      url,
    })),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const initialKey = initialPreviews.join("\0");

  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    const next = initialPreviews.map((url) => ({
      id: makeId(),
      preview: url,
      url,
    }));
    itemsRef.current.forEach((item) => {
      if (item.file) revokeBlobUrl(item.preview);
    });
    itemsRef.current = next;
    setItems(next);
    if (inputRef.current) inputRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reseed when source URLs change
  }, [initialKey]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.file) revokeBlobUrl(item.preview);
      });
    };
  }, []);

  const onFilesSelect = (selected: File[]): void => {
    if (!selected.length) return;
    const availableSlots =
      maxItems == null
        ? selected.length
        : Math.max(0, maxItems - itemsRef.current.length);
    const accepted = selected.slice(0, availableSlots);
    const added: ImageUploadItem[] = accepted.map((file) => ({
      id: makeId(),
      preview: URL.createObjectURL(file),
      file,
    }));
    const next = [...itemsRef.current, ...added];
    itemsRef.current = next;
    setItems(next);
    const omittedCount = selected.length - accepted.length;
    if (omittedCount > 0) {
      toast.info(
        omittedCount === 1
          ? "Image limit reached. 1 image was not added."
          : `Image limit reached. ${omittedCount} images were not added.`,
      );
    }
  };

  const removeAt = (index: number) => {
    const target = itemsRef.current[index];
    if (target?.file) revokeBlobUrl(target.preview);
    const next = itemsRef.current.filter((_, i) => i !== index);
    itemsRef.current = next;
    setItems(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const clear = () => {
    itemsRef.current.forEach((item) => {
      if (item.file) revokeBlobUrl(item.preview);
    });
    itemsRef.current = [];
    setItems([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const resolveValues = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const item of items) {
      if (item.file) {
        urls.push(await uploadBookCoverToStaging(item.file));
      } else if (item.url) {
        urls.push(item.url);
      }
    }
    if (!urls.length && fallback) return [fallback];
    return urls;
  };


  return {
    items,
    previews: items.map((item) => item.preview),
    inputRef,
    onFilesSelect,
    removeAt,
    clear,
    resolveValues,
  };
}
