"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Book, readBooks } from "@/lib/api/book";
import { bookKeys } from "@/lib/api/query-keys";
import usePagination from "@/lib/pagination/usePagination";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";

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

function BookCard({ book }: { book: Book }) {
  const primaryAuthor = book.authors?.[0];
  return (
    <article className="group">
      <Link href={`/books/${book.id}`} className="block">
        <div className="aspect-[2/3] overflow-hidden bg-muted">
          {book.image ? (
            <img
              src={book.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No cover
            </div>
          )}
        </div>
      </Link>
      <div className="mt-3 space-y-1">
        <Link href={`/books/${book.id}`}>
          <h2 className="font-display text-base font-semibold leading-snug transition-colors group-hover:underline">
            {book.title}
          </h2>
        </Link>
        {primaryAuthor ? (
          <Link
            href={`/authors/${primaryAuthor.id}`}
            className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {primaryAuthor.name}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Unknown author</p>
        )}
        {book.synopsis ? (
          <p className="line-clamp-2 pt-1 text-sm text-muted-foreground/90">
            {book.synopsis}
          </p>
        ) : null}
      </div>
    </article>
  );
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
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Books
          </h1>
          <p className="mt-2 text-muted-foreground">
            Search the catalog across sellers
          </p>
        </div>
        <SearchInput
          wrapperClassName="w-full sm:max-w-sm"
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && books.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Loading books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">
            No books found. Try adjusting your search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

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
    </>
  );
}

export default function BooksPage() {
  return (
    <div className="storefront-paper min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <Suspense
          fallback={
            <div className="py-20 text-center text-muted-foreground">
              Loading books...
            </div>
          }
        >
          <BooksCatalog />
        </Suspense>
      </div>
    </div>
  );
}
