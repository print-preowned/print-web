"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteMultiSelect, type AutocompleteOption } from "@/components/autocomplete";
import { apiFetch } from "@/lib/api";
import { authorLabel, readAuthors, type Author } from "@/lib/api/author";
import type { PaginatedResponse } from "@/lib/model";

/** A catalog author (id) or a name typed as it appears on the book. */
export type NewBookAuthor = { id?: string; name: string };

const TYPED_PREFIX = "typed:";

function optionValue(author: NewBookAuthor) {
  return author.id ?? `${TYPED_PREFIX}${author.name}`;
}

function fromOptionValue(value: string, matches: Author[]): NewBookAuthor | null {
  if (value.startsWith(TYPED_PREFIX)) {
    return { name: value.slice(TYPED_PREFIX.length) };
  }
  const author = matches.find((candidate) => candidate.id === value);
  return author ? { id: author.id, name: authorLabel(author) } : null;
}

/**
 * Sellers don't create author records. Matches from the catalog link by id;
 * a name nobody matches is kept as typed for platform staff to resolve.
 */
export function NewBookAuthorsField({
  value,
  onChange,
}: {
  value: NewBookAuthor[];
  onChange: (authors: NewBookAuthor[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(() => setDebounced(trimmed), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useQuery<PaginatedResponse<Author>>({
    queryKey: ["authors", "lookup", debounced],
    queryFn: () =>
      apiFetch(readAuthors({ page: 1, size: 10, filter: { search: debounced } })),
    enabled: debounced.length >= 2,
  });
  const matches = search.data?.data ?? [];

  const options: AutocompleteOption[] = matches.map((author) => ({
    value: author.id,
    label: authorLabel(author),
    description: author.status === "PROVISIONAL" ? "Unconfirmed" : undefined,
  }));
  // Whatever is already chosen stays labelled after the search moves on.
  for (const author of value) {
    const chosen = optionValue(author);
    if (!options.some((option) => option.value === chosen)) {
      options.push({ value: chosen, label: author.name });
    }
  }
  const typed = query.trim();
  const exact = matches.some(
    (author) => authorLabel(author).toLowerCase() === typed.toLowerCase(),
  );
  if (typed.length >= 2 && !exact) {
    options.push({
      value: `${TYPED_PREFIX}${typed}`,
      label: typed,
      description: "Add as written on the book",
    });
  }

  return (
    <AutocompleteMultiSelect
      id="new-book-authors"
      label="Authors"
      placeholder="Type a name"
      options={options}
      selectedIds={value.map(optionValue)}
      onSelectedIdsChange={(ids) => {
        const chosen = new Map(value.map((author) => [optionValue(author), author]));
        onChange(
          ids
            .map((id) => chosen.get(id) ?? fromOptionValue(id, matches))
            .filter((author): author is NewBookAuthor => author !== null),
        );
        setQuery("");
      }}
      onInputValueChange={setQuery}
      noResultsMessage={debounced.length < 2 ? "Type at least two letters" : "No authors match"}
    />
  );
}
