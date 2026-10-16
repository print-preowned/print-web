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
import { CatalogFormShell } from "@/components/admin/catalog-form-shell";
import { FormSection } from "@/components/admin/form-section";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { updateBook, Book } from "@/lib/api/book";
import { previewWorkTitle } from "@/lib/api/work-title";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminWorkPublications } from "./publications";

type BookFormProps = {
  book: Book;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const EMPTY_IDS: string[] = [];
const FORM_ID = "admin-book-form";

function linkedAuthorIds(book?: Book): string[] {
  return book?.authors?.flatMap((author) => (author.id ? [author.id] : [])) ?? EMPTY_IDS;
}

function linkedGenreIds(book?: Book): string[] {
  return book?.genres?.map((g) => g.id) ?? EMPTY_IDS;
}

export function AdminBookForm({ book, onSuccess, onCancel }: BookFormProps) {
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
      description: book?.description ?? "",
    },
  });

  const imageUpload = useImageUpload({
    initialPreviews: book.images ?? [],
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
      description: book.description,
    });
  }, [book, resetForm]);

  const updateMutation = useMutation({
    mutationFn: async (values: CreateBookFormValues) => {
      const request = updateBook(book!.id, {
        title: values.title,
        titlePrefix: values.titlePrefix ?? "",
        subtitle: values.subtitle ?? "",
        images: values.images,
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
      images: await imageUpload.resolveValues(),
      description: data.description.trim(),
      authorIds: selectedAuthorIds,
      genreIds: selectedGenreIds,
    };
    updateMutation.mutate(values);
  });

  const displayTitle =
    previewWorkTitle(
      watch("titlePrefix") ?? "",
      watch("title"),
      watch("subtitle") ?? "",
    ) || book.title.displayTitle;

  const authorSummary =
    book.authors?.map((author) => author.name).filter(Boolean).join(", ") ||
    (selectedAuthorIds.length ? `${selectedAuthorIds.length} selected` : "—");

  const genreSummary =
    book.genres?.map((genre) => genre.name).join(", ") ||
    (selectedGenreIds.length ? `${selectedGenreIds.length} selected` : "—");

  return (
    <div key={book.id} className="space-y-6">
      <form id={FORM_ID} onSubmit={onSubmit}>
        <CatalogFormShell
          summaryLeading={
            imageUpload.previews[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUpload.previews[0]}
                alt=""
                className="h-28 w-20 rounded object-cover"
              />
            ) : null
          }
          summaryRows={[
            { label: "Title", value: displayTitle || "—" },
            { label: "Authors", value: authorSummary },
            { label: "Genres", value: genreSummary },
          ]}
          actions={
            <>
              <Button
                type="submit"
                form={FORM_ID}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending ? "Updating…" : "Update book"}
              </Button>
              {onCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={updateMutation.isPending}
                  onClick={onCancel}
                  className="w-full"
                >
                  Cancel
                </Button>
              ) : null}
            </>
          }
        >
          <FormSection
            title="Work"
            description="Canonical title, images, and who it’s by. Shared across every edition."
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
              imageUpload={imageUpload}
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
          </FormSection>
        </CatalogFormShell>
      </form>

      <FormSection
        title="Publications"
        description="Publications save separately from the work."
      >
        <AdminWorkPublications workId={book.id} workTitle={displayTitle} />
      </FormSection>
    </div>
  );
}
