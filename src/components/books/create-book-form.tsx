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
import { previewWorkTitle } from "@/lib/api/work-title";

export type CreateBookFormValues = {
  title: string;
  titlePrefix?: string;
  subtitle?: string;
  image: string;
  description: string;
  authorIds: string[];
  genreIds: string[];
};

export type CreateBookFormFieldsProps = {
  title: string;
  onTitleChange: (value: string) => void;
  titlePrefix?: string;
  onTitlePrefixChange?: (value: string) => void;
  subtitle?: string;
  onSubtitleChange?: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imagePreview?: string | null;
  onFileSelect: (file: File) => void;
  onImageClear: () => void;
  imageInputRef?: React.RefObject<HTMLInputElement | null>;
  titleError?: string;
  descriptionError?: string;
  className?: string;
  children?: React.ReactNode;
};

export function CreateBookFormFields({
  title,
  onTitleChange,
  titlePrefix = "",
  onTitlePrefixChange,
  subtitle = "",
  onSubtitleChange,
  description,
  onDescriptionChange,
  imagePreview = null,
  onFileSelect,
  onImageClear,
  imageInputRef,
  titleError,
  descriptionError,
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
        {onTitlePrefixChange ? (
          <p className="text-muted-foreground text-xs">
            This is the filing title. Put articles such as The or Le in the prefix.
          </p>
        ) : null}
      </div>

      {onTitlePrefixChange ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="book-title-prefix">Title prefix</Label>
            <Input
              id="book-title-prefix"
              placeholder="The"
              value={titlePrefix}
              onChange={(e) => onTitlePrefixChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="book-subtitle">Subtitle</Label>
            <Input
              id="book-subtitle"
              placeholder="Subtitle"
              value={subtitle}
              onChange={(e) => onSubtitleChange?.(e.target.value)}
            />
          </div>
          <p className="text-muted-foreground text-xs sm:col-span-2">
            Displays as {previewWorkTitle(titlePrefix, title, subtitle) || "—"}.
          </p>
        </div>
      ) : null}

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
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={2}
        />
        {descriptionError && (
          <p className="text-sm text-red-500">{descriptionError}</p>
        )}
      </div>

      {children}
    </div>
  );
}

export type CreateBookFormProps = {
  defaultTitle?: string;
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
  const [description, setDescription] = useState("");
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const image = useImageUpload();

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setSelectedAuthorIds([]);
    setSelectedGenreIds([]);
    image.clear();
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    await onSubmit({
      title: trimmedTitle,
      image: await image.resolveValue(),
      description: description.trim(),
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
        description={description}
        onDescriptionChange={setDescription}
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
