"use client";

import { useEffect, useRef, useState } from "react";
import { uploadBookCoverToStaging } from "@/lib/api/book-image";

export const DEFAULT_IMAGE_PLACEHOLDER = "https://placehold.co/400";

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export type UseImageUploadOptions = {
  initialPreview?: string | null;
  onValueChange?: (value: string) => void;
  fallback?: string;
};

export function useImageUpload({
  initialPreview = null,
  onValueChange,
  fallback = DEFAULT_IMAGE_PLACEHOLDER,
}: UseImageUploadOptions = {}) {
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(initialPreview);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [initialPreview]);

  useEffect(() => {
    return () => revokeBlobUrl(preview);
  }, [preview]);

  const onFileSelect = (selected: File) => {
    revokeBlobUrl(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    onValueChange?.("");
  };

  const clear = () => {
    revokeBlobUrl(preview);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onValueChange?.("");
  };

  const resolveValue = async (existingValue = ""): Promise<string> => {
    if (file) return uploadBookCoverToStaging(file);
    if (existingValue) return existingValue;
    return fallback;
  };

  return {
    preview,
    inputRef,
    onFileSelect,
    clear,
    resolveValue,
  };
}
