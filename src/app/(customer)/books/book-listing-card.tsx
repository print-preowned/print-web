import Link from "next/link";
import type { CatalogWork } from "@customer/api";
import { firstImage } from "@/lib/cover";
import { cn } from "@/lib/utils";
import { catalogWorkLines } from "./catalog-lines";
import { BookGenreTag } from "./book-genre-tag";

type BookListingCardProps = {
  book: CatalogWork;
  animationDelay?: number;
  className?: string;
};

export function BookListingCard({
  book,
  animationDelay,
  className,
}: BookListingCardProps) {
  const cover = firstImage(book.images);
  const author = book.authors?.[0]?.name;
  const primaryGenre = book.genres?.[0];
  const lines = catalogWorkLines(book);

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
          {cover ? (
            <img
              src={cover}
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
            {book.title.displayTitle}
          </h2>
        </Link>

        {author ? (
          <p className="text-sm text-muted-foreground">{author}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Unknown author</p>
        )}

        {lines.map((line) => (
          <p key={line} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}

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
