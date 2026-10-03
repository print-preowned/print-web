import { generateUrl } from ".";

export const PRODUCT_FORMS = [
  { value: "PAPERBACK", label: "Paperback" },
  { value: "HARDCOVER", label: "Hardcover" },
  { value: "EBOOK", label: "Ebook" },
  { value: "AUDIOBOOK", label: "Audiobook" },
  { value: "OTHER", label: "Other" },
] as const;

export type ProductForm = (typeof PRODUCT_FORMS)[number]["value"];

export function formatProductForm(value: string) {
  return PRODUCT_FORMS.find((form) => form.value === value)?.label ?? value;
}

export type Publication = {
  id: string;
  work_id: string;
  work?: {
    id: string;
    title: string;
    image?: string | null;
    authors?: { id: string; name?: string | null }[];
  } | null;
  isbn13: string | null;
  title: string | null;
  image: string | null;
  language: string | null;
  binding?: string;
  productForm?: ProductForm | string | null;
  volume_number: number | null;
  edition: string | null;
  editionStatement?: string | null;
  editionNumber?: number | null;
  identifiers?: { scheme: string; value: string }[];
  normalizedTitle?: string | null;
  publishedDate?: string | null;
  publishedDatePrecision?: "YEAR" | "MONTH" | "DAY" | null;
  publishingStatus?: "ACTIVE" | "OUT_OF_PRINT" | "FORTHCOMING" | null;
  countryOfPublication?: string | null;
  heightMm?: number | null;
  widthMm?: number | null;
  thicknessMm?: number | null;
  page_count: number | null;
  pageCount?: number | null;
  weight_grams: number | null;
  weightGrams?: number | null;
  volumeNumber?: number | null;
  isVerified?: boolean;
  is_verified: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type PublicationCreatePayload = {
  work_id: string;
  isbn13?: string | null;
  title?: string | null;
  image?: string | null;
  language?: string | null;
  product_form?: ProductForm | string | null;
  volume_number?: number | null;
  edition?: string | null;
  edition_number?: number | null;
  published_date?: string | null;
  published_date_precision?: "YEAR" | "MONTH" | "DAY" | null;
  country_of_publication?: string | null;
  publishing_status?: "ACTIVE" | "OUT_OF_PRINT" | "FORTHCOMING" | null;
  height_mm?: number | null;
  width_mm?: number | null;
  thickness_mm?: number | null;
  page_count?: number | null;
  weight_grams?: number | null;
};

export type PublicationUpdatePayload = {
  isbn13?: string | null;
  title?: string | null;
  image?: string | null;
  language?: string | null;
  product_form?: ProductForm | string | null;
  volume_number?: number | null;
  edition?: string | null;
  edition_number?: number | null;
  published_date?: string | null;
  published_date_precision?: "YEAR" | "MONTH" | "DAY" | null;
  country_of_publication?: string | null;
  publishing_status?: "ACTIVE" | "OUT_OF_PRINT" | "FORTHCOMING" | null;
  height_mm?: number | null;
  width_mm?: number | null;
  thickness_mm?: number | null;
  page_count?: number | null;
  weight_grams?: number | null;
  is_verified?: boolean;
};

export function readPublicationByIsbn(isbn: string) {
  return generateUrl("/publications", { isbn });
}

export function readWorkPublications(workId: string) {
  return generateUrl(`/works/${workId}/publications`);
}

export function readPublicationOffers(publicationId: string) {
  return generateUrl(`/publications/${publicationId}/offers`);
}

export function createPublication(payload: PublicationCreatePayload) {
  return {
    endpoint: "/publications",
    method: "POST" as const,
    body: payload,
  };
}

export function updatePublication(id: string, payload: PublicationUpdatePayload) {
  return {
    endpoint: `/publications/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deletePublication(id: string) {
  return {
    endpoint: `/publications/${id}`,
    method: "DELETE" as const,
  };
}
