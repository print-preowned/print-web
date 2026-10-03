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
import { updateBook, Book } from "@/lib/api/book";
import { previewWorkTitle } from "@/lib/api/work-title";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useDrawerFooter } from "@/components/form-drawer";
import { AdminWorkPublications } from "./publications";

type BookFormProps = {
  book: Book;
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
      title: book?.title?.titleWithoutPrefix ?? "",
      titlePrefix: book?.title?.titlePrefix ?? "",
      subtitle: book?.title?.subtitle ?? "",
      image: book?.image ?? "",
      description: book?.description ?? "",
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
      title: book.title.titleWithoutPrefix,
      titlePrefix: book.title.titlePrefix ?? "",
      subtitle: book.title.subtitle ?? "",
      image: book.image,
      description: book.description,
    });
  }, [book, resetForm]);

  const updateMutation = useMutation({
    mutationFn: async (values: CreateBookFormValues) => {
      const request = updateBook(book!.id, {
        title: values.title,
        titlePrefix: values.titlePrefix ?? "",
        subtitle: values.subtitle ?? "",
        image: values.image,
        description: values.description,
        authorIds: values.authorIds,
        genreIds: values.genreIds,
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
      titlePrefix: data.titlePrefix?.trim(),
      subtitle: data.subtitle?.trim(),
      image: await image.resolveValue(data.image),
      description: data.description.trim(),
      authorIds: selectedAuthorIds,
      genreIds: selectedGenreIds,
    };
    updateMutation.mutate(values);
  });

  useDrawerFooter({
    formId: "admin-book-form",
    submitLabel: "Update Book",
    loadingLabel: "Updating...",
    isLoading: updateMutation.isPending,
  });

  return (
    <div key={book?.id ?? "new"} className="flex flex-col gap-4">
      <form
        id="admin-book-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
      >
        <CreateBookFormFields
          title={watch("title")}
          onTitleChange={(value) =>
            setValue("title", value, { shouldValidate: true, shouldDirty: true })
          }
          titlePrefix={watch("titlePrefix") ?? ""}
          onTitlePrefixChange={(value) =>
            setValue("titlePrefix", value, { shouldDirty: true })
          }
          subtitle={watch("subtitle") ?? ""}
          onSubtitleChange={(value) =>
            setValue("subtitle", value, { shouldDirty: true })
          }
          description={watch("description")}
          onDescriptionChange={(value) =>
            setValue("description", value, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          imagePreview={image.preview}
          onFileSelect={image.onFileSelect}
          onImageClear={image.clear}
          imageInputRef={image.inputRef}
          titleError={errors.title?.message}
          descriptionError={errors.description?.message}
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
      <AdminWorkPublications
        workId={book.id}
        workTitle={
          previewWorkTitle(
            watch("titlePrefix") ?? "",
            watch("title"),
            watch("subtitle") ?? "",
          ) || book.title.displayTitle
        }
      />
    </div>
  );
}
