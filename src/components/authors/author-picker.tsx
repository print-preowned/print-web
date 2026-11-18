"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteSelect } from "@/components/autocomplete";
import { apiFetch } from "@/lib/api";
import { authorLabel, readAuthors, type Author } from "@/lib/api/author";
import type { PaginatedResponse } from "@/lib/model";

/** Search the catalog for one author. */
export function AuthorPicker({
  id,
  label = "Existing author",
  value,
  onChange,
}: {
  id: string;
  label?: string;
  value: string | null;
  onChange: (author: Author | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [picked, setPicked] = useState<Author | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useQuery<PaginatedResponse<Author>>({
    queryKey: ["authors", "lookup", debounced],
    queryFn: () =>
      apiFetch(readAuthors({ page: 1, size: 10, filter: { search: debounced } })),
    enabled: debounced.length >= 2,
  });
  const matches = search.data?.data ?? [];

  const options = matches.map((author) => ({
    value: author.id,
    label: authorLabel(author),
    description: author.status === "PROVISIONAL" ? "Unconfirmed" : undefined,
  }));
  // Keep the chosen author labelled once the search has moved on.
  if (picked && !options.some((option) => option.value === picked.id)) {
    options.push({ value: picked.id, label: authorLabel(picked), description: undefined });
  }

  return (
    <AutocompleteSelect
      id={id}
      label={label}
      placeholder="Search authors…"
      options={options}
      value={value}
      onValueChange={(next) => {
        const author =
          matches.find((candidate) => candidate.id === next) ??
          (picked?.id === next ? picked : null);
        setPicked(author);
        onChange(author);
      }}
      onInputValueChange={setQuery}
      showClear
      noResultsMessage={debounced.length < 2 ? "Type at least two letters" : "No authors match"}
    />
  );
}
