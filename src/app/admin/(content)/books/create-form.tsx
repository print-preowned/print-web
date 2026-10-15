"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { createBook, type Book } from "@/lib/api/book";
import { previewWorkTitle } from "@/lib/api/work-title";
import {
  createPublication,
  formatProductForm,
  PublicationCreatePayload,
} from "@/lib/api/publication";
import { readAuthors, type Author } from "@/lib/api/author";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/lib/api/user";
import {
  EMPTY_PUBLICATION_DRAFT,
  isbnFieldError,
  publicationFieldsFromDraft,
  publishedDateError,
  type PublicationDraft,
} from "./publication-draft";
import { PublicationFields } from "./publication-fields";

type Props = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function AdminCreateBookForm({ onSuccess, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [publication, setPublication] = useState<PublicationDraft>(EMPTY_PUBLICATION_DRAFT);
  const [isbnError, setIsbnError] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateBookFormSchema>({
    resolver: zodResolver(createBookFormSchema),
    defaultValues: {
      title: "",
      titlePrefix: "",
      subtitle: "",
      image: "",
      description: "",
    },
  });

  const workTitle = watch("title");
  const titlePrefix = watch("titlePrefix") ?? "";
  const subtitle = watch("subtitle") ?? "";
  const displayTitle = previewWorkTitle(titlePrefix, workTitle, subtitle);
  const publicationPlaceholder = useMemo(
    () => displayTitle.trim() || "Same as work",
    [displayTitle],
  );

  const { data: authorsData } = useQuery<PaginatedResponse<Author>>({
    queryKey: ["authors", { page: 1, size: 100 }],
    queryFn: () => apiFetch(readAuthors({ page: 1, size: 100 })),
  });
  const authorNames = useMemo(() => {
    const byId = new Map(
      (authorsData?.data ?? []).map((author) => [
        author.id,
        author.name.displayNameFlat,
      ]),
    );
    return selectedAuthorIds
      .map((id) => byId.get(id))
      .filter((name): name is string => Boolean(name));
  }, [authorsData?.data, selectedAuthorIds]);

  const image = useImageUpload({
    onValueChange: (value) =>
      setValue("image", value, { shouldValidate: true, shouldDirty: true }),
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateBookFormValues) => {
      const request = createBook({
        title: values.title,
        titlePrefix: values.titlePrefix || undefined,
        subtitle: values.subtitle || undefined,
        images: values.image ? [values.image] : [],
        description: values.description,
        authorIds: values.authorIds,
        genreIds: values.genreIds,
      });
      const book = await apiFetch<Book>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      const publicationRequest = createPublication(
        publicationFieldsFromDraft(publication, book.title.displayTitle, book.id) as PublicationCreatePayload,
      );
      try {
        await apiFetch(publicationRequest.endpoint, {
          method: publicationRequest.method,
          body: publicationRequest.body,
        });
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? `Work created, but the publication could not be saved: ${error.message}`
            : "Work created, but the publication could not be saved.",
        );
      }
      return book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book created");
      onSuccess?.();
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.error(error.message || "Failed to create book");
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const error = isbnFieldError(publication.isbn13);
    if (error) {
      setIsbnError(error);
      return;
    }
    const dateError = publishedDateError(publication.published_date);
    if (dateError) {
      toast.error(dateError);
      return;
    }
    const values: CreateBookFormValues = {
      title: data.title.trim(),
      titlePrefix: data.titlePrefix?.trim(),
      subtitle: data.subtitle?.trim(),
      image: await image.resolveValue(data.image),
      description: data.description.trim(),
      authorIds: selectedAuthorIds,
      genreIds: selectedGenreIds,
    };
    createMutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit}>
      <CatalogFormShell
        summaryLeading={
          image.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.preview}
              alt=""
              className="h-28 w-20 rounded object-cover"
            />
          ) : null
        }
        summaryRows={[
          {
            label: "Title",
            value: displayTitle.trim() || "—",
          },
          {
            label: "Authors",
            value:
              authorNames.length > 0
                ? authorNames.join(", ")
                : selectedAuthorIds.length
                  ? `${selectedAuthorIds.length} selected`
                  : "—",
          },
          {
            label: "Genres",
            value: selectedGenreIds.length
              ? `${selectedGenreIds.length} selected`
              : "—",
          },
          {
            label: "ISBN",
            value: publication.isbn13.trim() || "—",
          },
          {
            label: "Product form",
            value: formatProductForm(publication.product_form),
          },
          {
            label: "Language",
            value: publication.language.trim() || "—",
          },
          {
            label: "Published",
            value: publication.published_date.trim() || "—",
          },
        ]}
        actions={
          <>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? "Creating…" : "Create book"}
            </Button>
            {onCancel ? (
              <Button
                type="button"
                variant="ghost"
                disabled={createMutation.isPending}
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
          description="Canonical title, cover, and who it’s by. Shared across every edition."
        >
          <CreateBookFormFields
            title={workTitle}
            onTitleChange={(value) =>
              setValue("title", value, { shouldValidate: true, shouldDirty: true })
            }
            titlePrefix={titlePrefix}
            onTitlePrefixChange={(value) =>
              setValue("titlePrefix", value, { shouldDirty: true })
            }
            subtitle={subtitle}
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
            />
          </CreateBookFormFields>
        </FormSection>

        <FormSection
          title="First publication"
          description="The ISBN and product form sellers will offer. Add more editions after saving."
        >
          <PublicationFields
            draft={publication}
            onChange={setPublication}
            workTitle={publicationPlaceholder}
            isbnError={isbnError}
            onIsbnErrorChange={setIsbnError}
            idPrefix="create-publication"
          />
        </FormSection>
      </CatalogFormShell>
    </form>
  );
}
