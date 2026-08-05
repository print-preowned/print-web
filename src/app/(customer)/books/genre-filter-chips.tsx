import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookGenreTag } from "./book-genre-tag";

const GENRE_CHIPS = [
  "Fiction",
  "Non-fiction",
  "Poetry",
  "History",
  "Science",
  "Biography",
] as const;

type GenreFilterChipsProps = {
  activeQuery?: string;
  className?: string;
};

export function GenreFilterChips({
  activeQuery = "",
  className,
}: GenreFilterChipsProps) {
  const active = activeQuery.trim().toLowerCase();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {GENRE_CHIPS.map((genre) => {
        const isActive = active === genre.toLowerCase();
        return (
          <Link
            key={genre}
            href={`/books?q=${encodeURIComponent(genre)}`}
            className={cn(
              "rounded-sm transition-transform hover:scale-[1.03]",
              isActive && "ring-2 ring-accent ring-offset-2 ring-offset-[var(--background)]",
            )}
          >
            <BookGenreTag label={genre} />
          </Link>
        );
      })}
    </div>
  );
}
