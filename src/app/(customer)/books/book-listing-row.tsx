import Link from "next/link";
import type { Book } from "@/lib/api/book";
import {
  bookListingMeta,
  bookSynopsisExcerpt,
} from "./book-listing-details";
import { cn } from "@/lib/utils";
import { BookGenreTag } from "./book-genre-tag";

type BookListingRowProps = {
  book: Book;
  sellerCount?: number;
  fromPrice?: number | null;
  className?: string;
};

export function BookListingRow({
  book,
  sellerCount,
  fromPrice,
  className,
}: BookListingRowProps) {
  const author = book.authors?.[0]?.name;
  const genres = book.genres ?? [];
  const meta = bookListingMeta(book, {
    sellerCount,
    fromPrice,
    includeGenres: false,
  });
  const excerpt = bookSynopsisExcerpt(book.synopsis, 200);

  return (
    <article className={cn("book-listing-row group py-6", className)}>
      <div className="flex gap-4 sm:gap-6">
        <Link
          href={`/books/${book.id}`}
          className="block shrink-0 transition-opacity hover:opacity-90"
        >
          <div className="book-cover aspect-[2/3] w-20 bg-muted sm:w-24">
            {book.image ? (
              <img
                src={book.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                No cover
              </div>
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1 space-y-2">
          <Link href={`/books/${book.id}`}>
            <h2 className="font-display text-lg font-bold leading-snug transition-colors group-hover:text-accent group-hover:underline sm:text-xl">
              {book.title}
            </h2>
          </Link>

          {author ? (
            <p className="text-sm text-muted-foreground">{author}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Unknown author</p>
          )}

          <p className="book-listing-meta">{meta}</p>

          {genres.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {genres.slice(0, 4).map((genre) => (
                <BookGenreTag
                  key={genre.id}
                  label={genre.name}
                  href={`/books?q=${encodeURIComponent(genre.name)}`}
                />
              ))}
            </div>
          ) : null}

          {excerpt ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/90 sm:line-clamp-3">
              {excerpt}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
