"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  fallback?: string;
};

export function useImageUpload({
  initialPreviews = [],
  fallback = DEFAULT_IMAGE_PLACEHOLDER,
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
    setItems((prev) => {
      prev.forEach((item) => {
        if (item.file) revokeBlobUrl(item.preview);
      });
      return next;
    });
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

  const onFilesSelect = (selected: File[]) => {
    if (!selected.length) return;
    const added: ImageUploadItem[] = selected.map((file) => ({
      id: makeId(),
      preview: URL.createObjectURL(file),
      file,
    }));
    setItems((prev) => {
      const next = [...prev, ...added];
      return next;
    });
  };

  const removeAt = (index: number) => {
    setItems((prev) => {
      const target = prev[index];
      if (target?.file) revokeBlobUrl(target.preview);
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const clear = () => {
    setItems((prev) => {
      prev.forEach((item) => {
        if (item.file) revokeBlobUrl(item.preview);
      });
      return [];
    });
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
    if (!urls.length) return [fallback];
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
