"use client"

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateBookFormFields,
  CreateBookFormValues,
} from "@/components/books/create-book-form";
import { BookAuthorGenreFields } from "@/components/books/book-author-genre-fields";
import {
  CreateBookFormSchema,
  schema as createBookFormSchema,
} from "@/components/books/create-book-form-schema";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { createBook, updateBook, Book } from "@/lib/api/book";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useDrawerFooter } from "@/components/form-drawer";

type BookFormProps = {
  book?: Book;
  onSuccess?: () => void;
};

const EMPTY_IDS: string[] = [];

function linkedAuthorIds(book?: Book): string[] {
  return book?.authors?.map((a) => a.id) ?? EMPTY_IDS;
}

function linkedGenreIds(book?: Book): string[] {
  return book?.genres?.map((g) => g.id) ?? EMPTY_IDS;
}

export function AdminBookForm({ book, onSuccess }: BookFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!book;

  const defaultAuthorIds = useMemo(() => linkedAuthorIds(book), [book]);
  const defaultGenreIds = useMemo(() => linkedGenreIds(book), [book]);

  const [selectedAuthorIds, setSelectedAuthorIds] =
    useState<string[]>(defaultAuthorIds);
  const [selectedGenreIds, setSelectedGenreIds] =
    useState<string[]>(defaultGenreIds);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset: resetForm,
  } = useForm<CreateBookFormSchema>({
    resolver: zodResolver(createBookFormSchema),
    defaultValues: {
      title: book?.title ?? "",
      image: book?.image ?? "",
      synopsis: book?.synopsis ?? "",
    },
  });

  const image = useImageUpload({
    initialPreview: book?.image ?? null,
    onValueChange: (value) =>
      setValue("image", value, { shouldValidate: true, shouldDirty: true }),
  });

  useEffect(() => {
    setSelectedAuthorIds(defaultAuthorIds);
  }, [defaultAuthorIds]);

  useEffect(() => {
    setSelectedGenreIds(defaultGenreIds);
  }, [defaultGenreIds]);

  useEffect(() => {
    if (!book) return;
    resetForm({
      title: book.title,
      image: book.image,
      synopsis: book.synopsis,
    });
  }, [book, resetForm]);

  const createMutation = useMutation({
    mutationFn: async (values: CreateBookFormValues) => {
      const request = createBook({
        title: values.title,
        image: values.image,
        synopsis: values.synopsis,
        author_ids: values.authorIds,
        genre_ids: values.genreIds,
      });
      return apiFetch<Book>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book created successfully!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create book");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: CreateBookFormValues) => {
      const request = updateBook(book!.id, {
        title: values.title,
        image: values.image,
        synopsis: values.synopsis,
        author_ids: values.authorIds,
        genre_ids: values.genreIds,
      });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book updated successfully!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update book");
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const values: CreateBookFormValues = {
      title: data.title.trim(),
      image: await image.resolveValue(data.image),
      synopsis: data.synopsis.trim(),
      authorIds: selectedAuthorIds,
      genreIds: selectedGenreIds,
    };
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const submitLabel = isEditing ? "Update Book" : "Create Book";

  useDrawerFooter({
    formId: "admin-book-form",
    submitLabel,
    loadingLabel: isEditing ? "Updating..." : "Creating...",
    isLoading,
  });

  return (
    <form
      key={book?.id ?? "new"}
      id="admin-book-form"
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
    >
      <CreateBookFormFields
        title={watch("title")}
        onTitleChange={(value) =>
          setValue("title", value, { shouldValidate: true, shouldDirty: true })
        }
        synopsis={watch("synopsis")}
        onSynopsisChange={(value) =>
          setValue("synopsis", value, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
        imagePreview={image.preview}
        onFileSelect={image.onFileSelect}
        onImageClear={image.clear}
        imageInputRef={image.inputRef}
        titleError={errors.title?.message}
        synopsisError={errors.synopsis?.message}
      >
        <BookAuthorGenreFields
          selectedAuthorIds={selectedAuthorIds}
          onSelectedAuthorIdsChange={setSelectedAuthorIds}
          selectedGenreIds={selectedGenreIds}
          onSelectedGenreIdsChange={setSelectedGenreIds}
          linkedAuthors={book?.authors}
          linkedGenres={book?.genres}
        />
      </CreateBookFormFields>
    </form>
  );
}
