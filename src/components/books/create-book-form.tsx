"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageDropzone } from "@/components/image-dropzone";
import { BookAuthorGenreFields } from "@/components/books/book-author-genre-fields";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { cn } from "@/lib/utils";

export type CreateBookFormValues = {
  title: string;
  image: string;
  synopsis: string;
  authorIds: string[];
  genreIds: string[];
};

export type CreateBookFormFieldsProps = {
  title: string;
  onTitleChange: (value: string) => void;
  synopsis: string;
  onSynopsisChange: (value: string) => void;
  imagePreview?: string | null;
  onFileSelect: (file: File) => void;
  onImageClear: () => void;
  imageInputRef?: React.RefObject<HTMLInputElement | null>;
  titleError?: string;
  synopsisError?: string;
  className?: string;
  children?: React.ReactNode;
};

export function CreateBookFormFields({
  title,
  onTitleChange,
  synopsis,
  onSynopsisChange,
  imagePreview = null,
  onFileSelect,
  onImageClear,
  imageInputRef,
  titleError,
  synopsisError,
  className,
  children,
}: CreateBookFormFieldsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Label htmlFor="book-title">Title</Label>
        <Input
          id="book-title"
          placeholder="Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        {titleError && <p className="text-sm text-red-500">{titleError}</p>}
      </div>

      <ImageDropzone
        id="book-cover"
        preview={imagePreview}
        inputRef={imageInputRef}
        onFileSelect={onFileSelect}
        onClear={onImageClear}
      />

      <div className="space-y-2">
        <Label htmlFor="book-synopsis">Synopsis</Label>
        <Textarea
          id="book-synopsis"
          placeholder="Synopsis"
          value={synopsis}
          onChange={(e) => onSynopsisChange(e.target.value)}
          rows={2}
        />
        {synopsisError && (
          <p className="text-sm text-red-500">{synopsisError}</p>
        )}
      </div>

      {children}
    </div>
  );
}

export type CreateBookFormProps = {
  defaultTitle?: string;
  defaultAuthorIds?: string[];
  defaultGenreIds?: string[];
  onSubmit: (values: CreateBookFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  showActions?: boolean;
  sectionLabel?: string;
  className?: string;
};

export function CreateBookForm({
  defaultTitle = "",
  defaultAuthorIds = [],
  defaultGenreIds = [],
  onSubmit,
  onCancel,
  isPending = false,
  submitLabel = "Create book",
  cancelLabel = "Cancel",
  showActions = true,
  sectionLabel,
  className,
}: CreateBookFormProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [synopsis, setSynopsis] = useState("");
  const [selectedAuthorIds, setSelectedAuthorIds] =
    useState<string[]>(defaultAuthorIds);
  const [selectedGenreIds, setSelectedGenreIds] =
    useState<string[]>(defaultGenreIds);
  const image = useImageUpload();

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    setSelectedAuthorIds(defaultAuthorIds);
  }, [defaultAuthorIds]);

  useEffect(() => {
    setSelectedGenreIds(defaultGenreIds);
  }, [defaultGenreIds]);

  const reset = () => {
    setTitle("");
    setSynopsis("");
    setSelectedAuthorIds([]);
    setSelectedGenreIds([]);
    image.clear();
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    await onSubmit({
      title: trimmedTitle,
      image: await image.resolveValue(),
      synopsis: synopsis.trim() || trimmedTitle,
      authorIds: selectedAuthorIds,
      genreIds: selectedGenreIds,
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {sectionLabel && <Label>{sectionLabel}</Label>}
      <CreateBookFormFields
        title={title}
        onTitleChange={setTitle}
        synopsis={synopsis}
        onSynopsisChange={setSynopsis}
        imagePreview={image.preview}
        onFileSelect={image.onFileSelect}
        onImageClear={image.clear}
        imageInputRef={image.inputRef}
      >
        <BookAuthorGenreFields
          selectedAuthorIds={selectedAuthorIds}
          onSelectedAuthorIdsChange={setSelectedAuthorIds}
          selectedGenreIds={selectedGenreIds}
          onSelectedGenreIdsChange={setSelectedGenreIds}
        />
      </CreateBookFormFields>
      {showActions && (
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={!title.trim() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Creating…" : submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onCancel();
              }}
            >
              {cancelLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
