"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Book, readBooks } from "@/lib/api/book";
import { bookKeys } from "@/lib/api/query-keys";
import usePagination from "@/lib/pagination/usePagination";
import { Button } from "@/components/ui/button";
import { BookListingRow } from "./book-listing-row";
import { CatalogSearchForm } from "./catalog-search-form";
import { GenreFilterChips } from "./genre-filter-chips";

function pageFromSearchParams(searchParams: URLSearchParams): number {
  const parsed = Number.parseInt(searchParams.get("page") ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function booksCatalogPath(q?: string, page = 1): string {
  const params = new URLSearchParams();
  const trimmed = q?.trim();
  if (trimmed) params.set("q", trimmed);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/books?${qs}` : "/books";
}

function BooksCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const pageFromUrl = pageFromSearchParams(searchParams);

  const [search, setSearch] = useState(qFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(qFromUrl);

  useEffect(() => {
    setSearch(qFromUrl);
    setDebouncedSearch(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: books,
    isLoading,
    pagination,
    setPagination,
    totalPages,
  } = usePagination<Book>({
    queryKey: [...bookKeys.globalList, "customer"],
    getUrl: ({ page, size, search: q }) =>
      readBooks({
        page,
        size,
        filter: q ? { search: q as string } : undefined,
      }),
    initialPageSize: 20,
    initialPage: pageFromUrl,
    params: { search: debouncedSearch || undefined },
  });

  useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === pageFromUrl - 1
        ? prev
        : { ...prev, pageIndex: pageFromUrl - 1 },
    );
  }, [pageFromUrl, setPagination]);

  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    if (debouncedSearch === currentQ && pageFromUrl === 1) return;
    if (debouncedSearch !== currentQ) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      router.replace(booksCatalogPath(debouncedSearch), { scroll: false });
    }
  }, [debouncedSearch, pageFromUrl, router, searchParams, setPagination]);

  function goToPage(pageIndex: number) {
    setPagination((prev) => ({ ...prev, pageIndex }));
    router.replace(booksCatalogPath(debouncedSearch, pageIndex + 1), {
      scroll: false,
    });
  }

  const canGoPrev = pagination.pageIndex > 0;
  const canGoNext = pagination.pageIndex + 1 < totalPages;

  return (
    <>
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            {debouncedSearch ? `Results for “${debouncedSearch}”` : "Books"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {debouncedSearch
              ? "Search across titles, authors, and genres"
              : "Discover titles from independent sellers"}
          </p>
        </div>
      </div>

      <div className="sticky top-16 z-40 -mx-4 space-y-3 border-b border-border bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <CatalogSearchForm value={search} onChange={setSearch} />
        <GenreFilterChips activeQuery={debouncedSearch} />
      </div>

      <div className="mt-10">
        {isLoading && books.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Loading books…</p>
          </div>
        ) : books.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">
              No books found. Try a different search or pick a genre above.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {books.map((book) => (
                <li key={book.id}>
                  <BookListingRow book={book} />
                </li>
              ))}
            </ul>

            {totalPages > 1 ? (
              <div className="mt-12 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canGoPrev}
                  onClick={() => goToPage(pagination.pageIndex - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.pageIndex + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canGoNext}
                  onClick={() => goToPage(pagination.pageIndex + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

export default function BooksPage() {
  return (
    <div className="storefront-paper min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <Suspense
          fallback={
            <div className="py-20 text-center text-muted-foreground">
              Loading books…
            </div>
          }
        >
          <BooksCatalog />
        </Suspense>
      </div>
    </div>
  );
}
