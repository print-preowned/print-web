import {
  formatProductForm,
  type ProductForm,
  type Publication,
  type PublicationCreatePayload,
  type PublicationUpdatePayload,
} from "@/lib/api/publication";

export const ISBN_PATTERN = /^[0-9Xx-]{10,17}$/;
export const ISBN_ERROR_MESSAGE = "Use a valid ISBN-10 or ISBN-13";
export const PUBLISHED_DATE_ERROR =
  "Use a year, month, or day: 1969, 1969-10, or 1969-10-21.";

export type { ProductForm };
export { formatProductForm };

export type PublishingStatus = "ACTIVE" | "OUT_OF_PRINT" | "FORTHCOMING";

export type PublicationDraft = {
  isbn13: string;
  title: string;
  language: string;
  product_form: ProductForm;
  edition: string;
  edition_number: string;
  published_date: string;
  country_of_publication: string;
  publishing_status: "" | PublishingStatus;
  volume_number: string;
  page_count: string;
  weight_grams: string;
  height_mm: string;
  width_mm: string;
  thickness_mm: string;
  is_verified: boolean;
};

export const EMPTY_PUBLICATION_DRAFT: PublicationDraft = {
  isbn13: "",
  title: "",
  language: "",
  product_form: "PAPERBACK",
  edition: "",
  edition_number: "",
  published_date: "",
  country_of_publication: "",
  publishing_status: "",
  volume_number: "",
  page_count: "",
  weight_grams: "",
  height_mm: "",
  width_mm: "",
  thickness_mm: "",
  is_verified: true,
};

export function optionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function publishedDateError(value: string): string | null {
  const date = value.trim();
  if (!date) return null;
  if (/^\d{4}$/.test(date)) return null;
  const month = date.match(/^\d{4}-(\d{2})$/);
  if (month) {
    const monthNumber = Number(month[1]);
    return monthNumber >= 1 && monthNumber <= 12 ? null : PUBLISHED_DATE_ERROR;
  }
  const day = date.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (day) {
    const monthNumber = Number(day[1]);
    const dayNumber = Number(day[2]);
    if (monthNumber >= 1 && monthNumber <= 12 && dayNumber >= 1 && dayNumber <= 31) return null;
  }
  return PUBLISHED_DATE_ERROR;
}

function numberText(value: number | null | undefined) {
  return value != null ? String(value) : "";
}

export function isbnFieldError(value: string): string | null {
  const isbn = value.trim();
  if (isbn && !ISBN_PATTERN.test(isbn)) return ISBN_ERROR_MESSAGE;
  return null;
}

export function draftFromPublication(publication: Publication): PublicationDraft {
  const publishingStatus = publication.publishingStatus;
  const form = publication.productForm ?? publication.binding;
  return {
    isbn13: publication.isbn13 ?? "",
    title: publication.title ?? "",
    language: publication.language ?? "",
    product_form:
      form === "HARDCOVER" || form === "EBOOK" || form === "AUDIOBOOK" || form === "OTHER"
        ? form
        : "PAPERBACK",
    edition: publication.editionStatement ?? publication.edition ?? "",
    edition_number: numberText(publication.editionNumber),
    published_date: publication.publishedDate ?? "",
    country_of_publication: publication.countryOfPublication ?? "",
    publishing_status:
      publishingStatus === "ACTIVE" ||
      publishingStatus === "OUT_OF_PRINT" ||
      publishingStatus === "FORTHCOMING"
        ? publishingStatus
        : "",
    volume_number: numberText(publication.volumeNumber ?? publication.volume_number),
    page_count: numberText(publication.pageCount ?? publication.page_count),
    weight_grams: numberText(publication.weightGrams ?? publication.weight_grams),
    height_mm: numberText(publication.heightMm),
    width_mm: numberText(publication.widthMm),
    thickness_mm: numberText(publication.thicknessMm),
    is_verified: publication.isVerified ?? publication.is_verified,
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
    product_form: draft.product_form,
    edition: draft.edition.trim() || null,
    edition_number: optionalInt(draft.edition_number) ?? null,
    published_date: draft.published_date.trim() || null,
    country_of_publication: draft.country_of_publication.trim() || null,
    publishing_status: draft.publishing_status || null,
    volume_number: optionalInt(draft.volume_number) ?? null,
    page_count: optionalInt(draft.page_count) ?? null,
    weight_grams: optionalInt(draft.weight_grams) ?? null,
    height_mm: optionalInt(draft.height_mm) ?? null,
    width_mm: optionalInt(draft.width_mm) ?? null,
    thickness_mm: optionalInt(draft.thickness_mm) ?? null,
  };
}
