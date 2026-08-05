import type { Book } from "@/lib/api/book";
import { formatPrice } from "@customer/api";

/** StoryGraph-style compact metadata for browse cards. */
export function bookListingMeta(
  book: Book,
  options?: {
    sellerCount?: number;
    fromPrice?: number | null;
    includeGenres?: boolean;
  },
): string {
  const parts: string[] = [];
  const includeGenres = options?.includeGenres ?? true;

  if (includeGenres) {
    const genres = book.genres?.slice(0, 2).map((g) => g.name);
    if (genres?.length) {
      parts.push(genres.join(" · "));
    }
  }

  if (options?.sellerCount != null && options.sellerCount > 0) {
    parts.push(
      `${options.sellerCount} ${options.sellerCount === 1 ? "seller" : "sellers"}`,
    );
  }

  if (options?.fromPrice != null) {
    parts.push(`from ${formatPrice(options.fromPrice)}`);
  }

  return parts.join(" · ");
}

export function bookSynopsisExcerpt(
  synopsis: string | null | undefined,
  maxLength = 140,
): string | null {
  const trimmed = synopsis?.trim();
  if (!trimmed) return null;
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
}
