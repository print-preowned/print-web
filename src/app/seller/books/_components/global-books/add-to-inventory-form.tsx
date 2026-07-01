"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book, readBooks, createBook } from "@/lib/api/book";
import { createBusinessBook } from "@/lib/api/business-book";
import { bookKeys, businessBookKeys } from "@/lib/api/query-keys";
import { PaginatedResponse } from "@/lib/api/user";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { CreateBookForm, CreateBookFormValues } from "@/components/books/create-book-form";
import { useApiMutation } from "@/lib/hooks/useApiMutation";

export function AddBookToInventoryForm({
  onSuccess,
  onAdded,
}: {
  onSuccess?: () => void;
  /** Called with global book id after a successful add (for variant setup flow). */
  onAdded?: (bookId: string) => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const { mutateAsync, isPending } = useApiMutation<{ id: string }>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: searchResult, isFetching: searchLoading } = useApiQuery<
    PaginatedResponse<Book>
  >(
    bookKeys.search(debouncedSearch),
    readBooks({ page: 1, size: 20, filter: { search: debouncedSearch } }),
    { enabled: debouncedSearch.length >= 1 && open },
  );
  const searchBooks: Book[] = searchResult?.data ?? [];

  const showDropdown = open && !showCreate;
  const hasSearchQuery = debouncedSearch.length >= 1;

  const invalidateAndResetAfterAdd = (bookId: string) => {
    queryClient.invalidateQueries({ queryKey: businessBookKeys.all });
    toast.success("Added to your inventory");
    setSearch("");
    setDebouncedSearch("");
    setOpen(false);
    if (onAdded) {
      void onAdded(bookId);
    } else {
      onSuccess?.();
    }
  };

  const addToInventory = async (bookId: string) => {
    try {
      await mutateAsync(createBusinessBook({ book_id: bookId }));
      invalidateAndResetAfterAdd(bookId);
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
      const createRes = await mutateAsync(createBook({
        title,
        image,
        synopsis,
        author_ids: authorIds,
        genre_ids: genreIds,
      }));
      if (!createRes.id) throw new Error("No book id returned");
      await mutateAsync(createBusinessBook({ book_id: createRes.id }));
      queryClient.invalidateQueries({ queryKey: ["books", ...businessBookKeys.all] });
      toast.success("Book created and added to your inventory");
      setShowCreate(false);
      setCreateTitle("");
      setSearch("");
      setDebouncedSearch("");
      setOpen(false);
      if (onAdded) {
        void onAdded(createRes.id);
      } else {
        onSuccess?.();
      }
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
                      onClick={() => addToInventory(b.id)}
                      disabled={isPending}
                    >
                      <span className="truncate font-medium">{b.title}</span>
                      <span className="text-muted-foreground shrink-0">
                        Add to inventory
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
