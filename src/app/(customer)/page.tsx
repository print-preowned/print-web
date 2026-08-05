import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Book, readBooks } from "@/lib/api/book";
import { BookListingCard } from "./books/book-listing-card";
import { CatalogSearchForm } from "./books/catalog-search-form";
import { GenreFilterChips } from "./books/genre-filter-chips";

type BooksResponse = {
  data?: Book[];
};

async function getRecentBooks(): Promise<Book[]> {
  try {
    const res = await apiFetch<BooksResponse>(
      readBooks({ page: 1, size: 12 }),
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const books = await getRecentBooks();

  return (
    <div>
      <section className="storefront-hero-accent border-b border-[color-mix(in_srgb,var(--foreground)_18%,transparent)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <p className="storefront-rise storefront-hero-label text-sm font-semibold uppercase tracking-[0.2em]">
            Independent booksellers
          </p>
          <h1 className="storefront-rise storefront-rise-delay-1 font-display mt-4 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
            Your next favourite book is already on a shelf somewhere
          </h1>
          <p className="storefront-rise storefront-rise-delay-2 storefront-hero-muted mt-5 max-w-xl text-base leading-relaxed md:text-lg">
            Search the catalog, follow a genre, compare seller offers — then
            choose the copy you actually want to keep.
          </p>

          <div className="storefront-rise storefront-rise-delay-3 mt-8 max-w-xl">
            <CatalogSearchForm size="hero" />
          </div>

          <div className="storefront-rise storefront-rise-delay-3 mt-6">
            <p className="storefront-hero-muted mb-3 text-xs font-medium uppercase tracking-wider">
              Jump in
            </p>
            <GenreFilterChips />
          </div>
        </div>
      </section>

      <section className="storefront-shelf py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                Fresh on the shelf
              </h2>
              <p className="mt-2 text-muted-foreground">
                Recently listed titles from sellers on PRINT
              </p>
            </div>
            <Link
              href="/books"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
            >
              Browse all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {books.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="text-muted-foreground">
                No books listed yet. Check back soon, or search the catalog.
              </p>
              <Link
                href="/books"
                className="mt-4 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                Go to books
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {books.map((book, i) => (
                <li key={book.id}>
                  <BookListingCard book={book} animationDelay={i * 50} />
                </li>
              ))}
            </ul>
          )}

          {books.length > 0 ? (
            <div className="mt-12 text-center">
              <Link
                href="/books"
                className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                View all books
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
