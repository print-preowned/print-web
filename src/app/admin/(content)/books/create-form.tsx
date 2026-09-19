"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { createBook, type Book } from "@/lib/api/book";
import { createPublication, PublicationCreatePayload } from "@/lib/api/publication";
import { apiFetch } from "@/lib/api";
import {
  EMPTY_PUBLICATION_DRAFT,
  isbnFieldError,
  publicationFieldsFromDraft,
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
      image: "",
      description: "",
    },
  });

  const workTitle = watch("title");
  const publicationPlaceholder = useMemo(
    () => workTitle.trim() || "Same as work",
    [workTitle],
  );

  const image = useImageUpload({
    onValueChange: (value) =>
      setValue("image", value, { shouldValidate: true, shouldDirty: true }),
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateBookFormValues) => {
      const request = createBook({
        title: values.title,
        image: values.image,
        description: values.description,
        author_ids: values.authorIds,
        genre_ids: values.genreIds,
      });
      const book = await apiFetch<Book>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      const publicationRequest = createPublication(
        publicationFieldsFromDraft(publication, book.title, book.id) as PublicationCreatePayload,
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
    const values: CreateBookFormValues = {
      title: data.title.trim(),
      image: await image.resolveValue(data.image),
      description: data.description.trim(),
      authorIds: selectedAuthorIds,
      genreIds: selectedGenreIds,
    };
    createMutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Work</h3>
          <p className="text-muted-foreground text-xs">
            Canonical title, cover, and who it’s by. Shared across every edition.
          </p>
        </div>
        <CreateBookFormFields
          title={workTitle}
          onTitleChange={(value) =>
            setValue("title", value, { shouldValidate: true, shouldDirty: true })
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
      </section>

      <section className="space-y-3 border-t pt-4">
        <div>
          <h3 className="text-sm font-medium">First publication</h3>
          <p className="text-muted-foreground text-xs">
            The ISBN and binding sellers will offer. Add more editions after saving.
          </p>
        </div>
        <PublicationFields
          draft={publication}
          onChange={setPublication}
          workTitle={publicationPlaceholder}
          isbnError={isbnError}
          onIsbnErrorChange={setIsbnError}
          idPrefix="create-publication"
        />
      </section>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" disabled={createMutation.isPending} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating…" : "Create book"}
        </Button>
      </div>
    </form>
  );
}
