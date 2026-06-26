"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { readAuthors, Author } from "@/lib/api/author";
import { readGenresListUrl, Genre } from "@/lib/api/genre";
import { AuthorRef, GenreRef } from "@/lib/api/book";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/lib/api/user";
import { AutocompleteMultiSelect } from "@/components/autocomplete-multi-select";
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

function mergeOptions(
  primary: { id: string; label: string }[],
  extras?: { id: string; label: string }[],
) {
  const merged = new Map(primary.map((option) => [option.id, option]));
  for (const extra of extras ?? []) {
    if (!merged.has(extra.id)) {
      merged.set(extra.id, extra);
    }
  }
  return [...merged.values()].sort((a, b) => a.label.localeCompare(b.label));
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
  const { data: authorsData } = useQuery<PaginatedResponse<Author>>({
    queryKey: ["authors", { page: 1, size: 200 }],
    queryFn: () => apiFetch(readAuthors({ page: 1, size: 200 })),
  });
  const authors = authorsData?.data ?? [];

  const { data: genresData } = useQuery<PaginatedResponse<Genre>>({
    queryKey: ["genres", { page: 1, size: 200 }],
    queryFn: () => apiFetch(readGenresListUrl({ page: 1, size: 200 })),
  });
  const genres = genresData?.data ?? [];

  const authorOptions = useMemo(
    () =>
      mergeOptions(
        authors.map((author) => ({
          id: author.id,
          label: authorLabel(author),
        })),
        linkedAuthors?.map((author) => ({
          id: author.id,
          label: author.name,
        })),
      ),
    [authors, linkedAuthors],
  );

  const genreOptions = useMemo(
    () =>
      mergeOptions(
        genres.map((genre) => ({
          id: genre.id,
          label: genre.name,
        })),
        linkedGenres?.map((genre) => ({
          id: genre.id,
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
