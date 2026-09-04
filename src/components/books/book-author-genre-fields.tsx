"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { readAuthors, Author } from "@/lib/api/author";
import { readGenresListUrl, Genre } from "@/lib/api/genre";
import { AuthorRef, GenreRef } from "@/lib/api/book";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth/context";
import { PaginatedResponse } from "@/lib/api/user";
import {
  AutocompleteMultiSelect,
  mergeAutocompleteOptions,
} from "@/components/autocomplete";
import { cn } from "@/lib/utils";

export type BookAuthorGenreFieldsProps = {
  selectedAuthorIds: string[];
  onSelectedAuthorIdsChange: (ids: string[]) => void;
  selectedGenreIds: string[];
  onSelectedGenreIdsChange: (ids: string[]) => void;
  linkedAuthors?: AuthorRef[];
  linkedGenres?: GenreRef[];
  className?: string;
};

function authorLabel(author: Author) {
  return [author.first_name, author.last_name].filter(Boolean).join(" ");
}

export function BookAuthorGenreFields({
  selectedAuthorIds,
  onSelectedAuthorIdsChange,
  selectedGenreIds,
  onSelectedGenreIdsChange,
  linkedAuthors,
  linkedGenres,
  className,
}: BookAuthorGenreFieldsProps) {
  const { context } = useAuth();
  const isAdmin = context === "PLATFORM";

  const { data: authorsData } = useQuery<PaginatedResponse<Author>>({
    queryKey: ["authors", { page: 1, size: 200 }],
    queryFn: () => apiFetch(readAuthors({ page: 1, size: 200 })),
  });
  const authors = authorsData?.data ?? [];

  const { data: genresData } = useQuery<PaginatedResponse<Genre>>({
    queryKey: ["genres", { page: 1, size: 200 }],
    queryFn: () =>
      apiFetch(readGenresListUrl({ page: 1, size: 200 })),
    enabled: isAdmin || context === "SELLER",
  });
  const genres = genresData?.data ?? [];

  const authorOptions = useMemo(
    () =>
      mergeAutocompleteOptions(
        authors.map((author) => ({
          value: author.id,
          label: authorLabel(author),
        })),
        linkedAuthors?.map((author) => ({
          value: author.id,
          label: author.name,
        })),
      ),
    [authors, linkedAuthors],
  );

  const genreOptions = useMemo(
    () =>
      mergeAutocompleteOptions(
        genres.map((genre) => ({
          value: genre.id,
          label: genre.name,
        })),
        linkedGenres?.map((genre) => ({
          value: genre.id,
          label: genre.name,
        })),
      ),
    [genres, linkedGenres],
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <AutocompleteMultiSelect
        id="book-genres"
        label="Genres"
        placeholder="Search genres..."
        options={genreOptions}
        selectedIds={selectedGenreIds}
        onSelectedIdsChange={onSelectedGenreIdsChange}
        selectedChipClassName="bg-primary text-primary-foreground"
        noResultsMessage="No genres match your search"
      />
      <AutocompleteMultiSelect
        id="book-authors"
        label="Authors"
        placeholder="Search authors..."
        options={authorOptions}
        selectedIds={selectedAuthorIds}
        onSelectedIdsChange={onSelectedAuthorIdsChange}
        selectedChipClassName="bg-secondary text-secondary-foreground"
        noResultsMessage="No authors match your search"
      />
    </div>
  );
}
