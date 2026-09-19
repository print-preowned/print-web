import type {
  Publication,
  PublicationCreatePayload,
  PublicationUpdatePayload,
} from "@/lib/api/publication";

export const ISBN_PATTERN = /^[0-9Xx-]{10,17}$/;
export const ISBN_ERROR_MESSAGE = "Use a valid ISBN-10 or ISBN-13";

export type Binding = "PAPERBACK" | "HARDCOVER" | "OTHER";

export type PublicationDraft = {
  isbn13: string;
  title: string;
  language: string;
  binding: Binding;
  edition: string;
  volume_number: string;
  page_count: string;
  weight_grams: string;
  is_verified: boolean;
};

export const EMPTY_PUBLICATION_DRAFT: PublicationDraft = {
  isbn13: "",
  title: "",
  language: "",
  binding: "PAPERBACK",
  edition: "",
  volume_number: "",
  page_count: "",
  weight_grams: "",
  is_verified: true,
};

export function formatBinding(binding: string) {
  if (binding === "PAPERBACK") return "Paperback";
  if (binding === "HARDCOVER") return "Hardcover";
  return binding === "OTHER" ? "Other" : binding;
}

export function optionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function isbnFieldError(value: string): string | null {
  const isbn = value.trim();
  if (isbn && !ISBN_PATTERN.test(isbn)) return ISBN_ERROR_MESSAGE;
  return null;
}

export function draftFromPublication(publication: Publication): PublicationDraft {
  return {
    isbn13: publication.isbn13 ?? "",
    title: publication.title ?? "",
    language: publication.language ?? "",
    binding:
      publication.binding === "HARDCOVER" || publication.binding === "OTHER"
        ? publication.binding
        : "PAPERBACK",
    edition: publication.edition ?? "",
    volume_number: publication.volume_number != null ? String(publication.volume_number) : "",
    page_count: publication.page_count != null ? String(publication.page_count) : "",
    weight_grams: publication.weight_grams != null ? String(publication.weight_grams) : "",
    is_verified: publication.is_verified,
  };
}

export function publicationFieldsFromDraft(
  draft: PublicationDraft,
  workTitle: string,
  workId?: string,
): Omit<PublicationUpdatePayload, "is_verified"> | PublicationCreatePayload {
  const isbn = draft.isbn13.trim();
  const title = draft.title.trim();
  return {
    ...(workId ? { work_id: workId } : {}),
    isbn13: isbn || null,
    title: !title || title === workTitle.trim() ? null : title,
    language: draft.language.trim() || null,
    binding: draft.binding,
    edition: draft.edition.trim() || null,
    volume_number: optionalInt(draft.volume_number) ?? null,
    page_count: optionalInt(draft.page_count) ?? null,
    weight_grams: optionalInt(draft.weight_grams) ?? null,
  };
}
