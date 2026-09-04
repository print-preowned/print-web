import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Book, readBookById } from "@/lib/api/book";
import {
  PublicCatalogSellerBook,
  readOffers,
} from "@customer/api";
import { PaginatedResponse } from "@/lib/api/user";
import { BookGenreTag } from "../book-genre-tag";
import { Marketplace } from "./marketplace";

type BookResponse = { data?: Book };

async function getBook(id: string): Promise<Book | null> {
  try {
    const res = await apiFetch<BookResponse>(readBookById(id));
    return res.data ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function getOffers(bookId: string): Promise<PublicCatalogSellerBook[]> {
  try {
    const res = await apiFetch<PaginatedResponse<PublicCatalogSellerBook>>(
      readOffers(bookId, { page: 1, size: 50 }),
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  const offers = await getOffers(id);
  const primaryAuthor = book.authors?.[0];
  const genres = book.genres ?? [];

  return (
    <div className="storefront-paper min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,240px)_1fr]">
          <div className="book-cover aspect-[2/3] overflow-hidden bg-muted md:sticky md:top-24 md:self-start">
            {book.image ? (
              <img
                src={book.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No cover
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <Link href="/books" className="hover:text-foreground">
                Books
              </Link>
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {book.title}
            </h1>
            {primaryAuthor ? (
              <p className="mt-3 text-lg text-muted-foreground">
                {primaryAuthor.name}
              </p>
            ) : null}

            {genres.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <BookGenreTag
                    key={genre.id}
                    label={genre.name}
                    href={`/books?q=${encodeURIComponent(genre.name)}`}
                  />
                ))}
              </div>
            ) : null}

            {book.synopsis ? (
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {book.synopsis}
              </p>
            ) : null}
          </div>
        </div>

        <Suspense fallback={null}>
          <Marketplace bookId={id} offers={offers} />
        </Suspense>
      </div>
    </div>
  );
}
