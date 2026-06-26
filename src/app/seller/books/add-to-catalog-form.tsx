"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book, readBooks, createBook } from "@/lib/api/book";
import { createBusinessBook } from "@/lib/api/business-book";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/lib/api/user";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { CreateBookForm, CreateBookFormValues } from "@/components/books/create-book-form";
import { useAppMutation } from "@/lib/hooks/useAppMutation";

export function AddBookToCatalogForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const { mutateAsync, isPending } = useAppMutation<{ id: string }>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: searchResult, isFetching: searchLoading } = useQuery({
    queryKey: ["books-search", debouncedSearch],
    queryFn: () =>
      apiFetch<PaginatedResponse<Book>>(
        readBooks({ page: 1, size: 20, filter: { search: debouncedSearch } }),
      ),
    enabled: debouncedSearch.length >= 1 && open,
  });
  const searchBooks: Book[] = searchResult?.data ?? [];

  const showDropdown = open && !showCreate;
  const hasSearchQuery = debouncedSearch.length >= 1;

  const invalidateAndResetAfterAdd = () => {
    queryClient.invalidateQueries({ queryKey: ["business-books"] });
    toast.success("Added to your catalog");
    setSearch("");
    setDebouncedSearch("");
    setOpen(false);
    onSuccess?.();
  };

  const addToCatalog = async (bookId: string) => {
    try {
      const req = createBusinessBook({ book_id: bookId });
      await mutateAsync({ endpoint: req.endpoint, body: req.body });
      invalidateAndResetAfterAdd();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    }
  };

  const openCreateForm = (title?: string) => {
    setShowCreate(true);
    setOpen(false);
    setCreateTitle(title ?? "");
  };

  const handleCreateAndAdd = async ({
    title,
    image,
    synopsis,
    authorIds,
    genreIds,
  }: CreateBookFormValues) => {
    try {
      const createReq = createBook({
        title,
        image,
        synopsis,
        author_ids: authorIds,
        genre_ids: genreIds,
      });
      const createRes = await mutateAsync({
        endpoint: createReq.endpoint,
        body: createReq.body,
      });
      if (!createRes.id) throw new Error("No book id returned");
      const addReq = createBusinessBook({ book_id: createRes.id });
      await mutateAsync({
        endpoint: addReq.endpoint,
        body: addReq.body,
      });
      queryClient.invalidateQueries({ queryKey: ["books", "business-books"] });
      toast.success("Book created and added to your catalog");
      setShowCreate(false);
      setCreateTitle("");
      setSearch("");
      setDebouncedSearch("");
      setOpen(false);
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 text-sm">
      <div className="space-y-2">
        <Label htmlFor="book-search">Search global books</Label>
        <div className="relative">
          <Input
            id="book-search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            placeholder="Title or keyword..."
            value={search}
            autoComplete="off"
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 150);
            }}
          />
          {showDropdown && (
            <ul
              role="listbox"
              className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border shadow-md"
            >
              {hasSearchQuery && searchLoading && (
                <li className="text-muted-foreground px-3 py-2 text-xs">
                  Searching…
                </li>
              )}
              {hasSearchQuery &&
                !searchLoading &&
                searchBooks.map((b) => (
                  <li key={b.id} role="option">
                    <button
                      type="button"
                      className="hover:bg-accent flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addToCatalog(b.id)}
                      disabled={isPending}
                    >
                      <span className="truncate font-medium">{b.title}</span>
                      <span className="text-muted-foreground shrink-0">
                        Add to catalog
                      </span>
                    </button>
                  </li>
                ))}
              {hasSearchQuery && !searchLoading && searchBooks.length === 0 && (
                <li className="text-muted-foreground px-3 py-2 text-xs">
                  No books found.
                </li>
              )}
              <li role="option" className="border-t">
                <button
                  type="button"
                  className="hover:bg-accent text-primary flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    openCreateForm(hasSearchQuery ? debouncedSearch : undefined)
                  }
                >
                  <PlusCircle className="size-3.5 shrink-0" />
                  {hasSearchQuery
                    ? `Create provisional book “${debouncedSearch}”`
                    : "Create new provisional book"}
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="border-t pt-4">
          <CreateBookForm
            defaultTitle={createTitle}
            onSubmit={handleCreateAndAdd}
            onCancel={() => {
              setShowCreate(false);
              setCreateTitle("");
            }}
            isPending={isPending}
            submitLabel="Create and add"
            sectionLabel="New provisional book"
          />
        </div>
      )}
    </div>
  );
}
