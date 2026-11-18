"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AutocompleteSelect } from "@/components/autocomplete";
import { apiFetch, apiErrorToast } from "@/lib/api";
import {
  authorLabel,
  readAuthors,
  readUnresolvedAuthorNames,
  resolveAuthorName,
  type Author,
  type UnresolvedAuthorName,
} from "@/lib/api/author";
import type { BaseResponse, PaginatedResponse } from "@/lib/model";
import { CreateFromNameForm } from "./create-from-name-form";

const UNRESOLVED_KEY = ["authors", "unresolved"] as const;

/**
 * Sellers type author names as they appear on the book. Each row here is one
 * spelling (case-insensitive) across every book that carries it; resolving it
 * links all of those books to one author record at once.
 */
export default function UnresolvedAuthorsPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState<UnresolvedAuthorName | null>(null);
  const names = useQuery<BaseResponse<UnresolvedAuthorName[]>>({
    queryKey: UNRESOLVED_KEY,
    queryFn: () => apiFetch(readUnresolvedAuthorNames()),
  });

  const resolve = useMutation({
    mutationFn: async (payload: Parameters<typeof resolveAuthorName>[0]) => {
      const request = resolveAuthorName(payload);
      return apiFetch<{ author_id: string; works_updated: number }>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: (result, payload) => linked(payload.names[0], result.works_updated),
    onError: (error: Error) => apiErrorToast(error, "Could not resolve that name"),
  });

  function linked(name: string, worksUpdated: number) {
    queryClient.invalidateQueries({ queryKey: UNRESOLVED_KEY });
    queryClient.invalidateQueries({ queryKey: ["authors"] });
    toast.success(`${name}: ${worksUpdated === 1 ? "1 book" : `${worksUpdated} books`} linked`);
  }

  const rows = names.data?.data ?? [];

  return (
    <div className="container mx-auto space-y-4 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-muted-foreground max-w-2xl text-sm">
          Names sellers wrote on books that aren&apos;t linked to an author yet. Pick the
          author it belongs to, or create one if it&apos;s not in the catalog. Every book
          with that name is linked at once.
        </p>
        <Button asChild variant="outline">
          <Link href="/admin/authors">All authors</Link>
        </Button>
      </div>

      {names.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing to resolve.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {rows.map((row) => (
            <UnresolvedRow
              key={row.name.toLowerCase()}
              row={row}
              busy={resolve.isPending}
              onLink={(authorId) => resolve.mutate({ names: row.variants, author_id: authorId })}
              onCreate={() => setCreating(row)}
            />
          ))}
        </ul>
      )}
      <Dialog open={creating !== null} onOpenChange={(open) => !open && setCreating(null)}>
        {creating ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create author</DialogTitle>
              <DialogDescription>
                From “{creating.name}”. Saving links{" "}
                {creating.workCount === 1 ? "its book" : `all ${creating.workCount} books`} to
                the new author.
              </DialogDescription>
            </DialogHeader>
            <CreateFromNameForm
              key={creating.name}
              row={creating}
              onDone={({ worksUpdated }) => {
                setCreating(null);
                linked(creating.name, worksUpdated);
              }}
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function UnresolvedRow({
  row,
  busy,
  onLink,
  onCreate,
}: {
  row: UnresolvedAuthorName;
  busy: boolean;
  onLink: (authorId: string) => void;
  onCreate: () => void;
}) {
  const [authorId, setAuthorId] = useState<string | null>(null);
  const others = row.variants.filter((variant) => variant !== row.name);

  return (
    <li className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
      <div className="min-w-0">
        <p className="font-medium">{row.name}</p>
        <p className="text-muted-foreground text-xs">
          {row.workCount === 1 ? "1 book" : `${row.workCount} books`}
          {others.length ? ` · also spelt ${others.join(", ")}` : ""}
        </p>
      </div>
      <AuthorPicker id={`pick-${row.name}`} value={authorId} onChange={setAuthorId} />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={busy || !authorId} onClick={() => authorId && onLink(authorId)}>
          Link books
        </Button>
        <span className="text-muted-foreground text-sm">or</span>
        <Button size="sm" variant="outline" disabled={busy} onClick={onCreate}>
          Create author
        </Button>
      </div>
    </li>
  );
}

function AuthorPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string | null;
  onChange: (authorId: string | null) => void;
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
      label="Existing author"
      placeholder="Search authors…"
      options={options}
      value={value}
      onValueChange={(next) => {
        setPicked(matches.find((author) => author.id === next) ?? null);
        onChange(next);
      }}
      onInputValueChange={setQuery}
      showClear
      noResultsMessage={debounced.length < 2 ? "Type at least two letters" : "No authors match"}
    />
  );
}
