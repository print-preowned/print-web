import Link from "next/link";
import type { Book } from "@/lib/api/book";
import { cn } from "@/lib/utils";
import { BookGenreTag } from "./book-genre-tag";

type BookListingCardProps = {
  book: Book;
  animationDelay?: number;
  className?: string;
};

export function BookListingCard({
  book,
  animationDelay,
  className,
}: BookListingCardProps) {
  const author = book.authors?.[0]?.name;
  const primaryGenre = book.genres?.[0];

  return (
    <article
      className={cn("storefront-fade group", className)}
      style={
        animationDelay != null
          ? { animationDelay: `${animationDelay}ms` }
          : undefined
      }
    >
      <Link href={`/books/${book.id}`} className="block">
        <div className="book-cover aspect-[2/3] overflow-hidden bg-muted">
          {book.image ? (
            <img
              src={book.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm text-muted-foreground">
              No cover
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 space-y-1.5">
        <Link href={`/books/${book.id}`}>
          <h2 className="font-display text-base font-bold leading-snug transition-colors group-hover:text-accent group-hover:underline">
            {book.title}
          </h2>
        </Link>

        {author ? (
          <p className="text-sm text-muted-foreground">{author}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Unknown author</p>
        )}

        {primaryGenre ? (
          <BookGenreTag
            label={primaryGenre.name}
            href={`/books?q=${encodeURIComponent(primaryGenre.name)}`}
            className="mt-1"
          />
        ) : null}
      </div>
    </article>
  );
}
