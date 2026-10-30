import { generateUrl } from ".";

export const PRODUCT_FORMS = [
  { value: "PAPERBACK", label: "Paperback" },
  { value: "HARDCOVER", label: "Hardcover" },
  { value: "EBOOK", label: "Ebook" },
  { value: "AUDIOBOOK", label: "Audiobook" },
  { value: "OTHER", label: "" },
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
    images?: string[] | null;
    authors?: { id: string; name?: string | null }[];
  } | null;
  isbn13: string | null;
  title: string | null;
  images: string[];
  language: string | null;
  productForm?: ProductForm | string | null;
  editionStatement?: string | null;
  editionNumber?: number | null;
  identifiers?: { scheme: string; value: string }[];
  normalizedTitle?: string | null;
  publishedDate?: string | null;
  publishingStatus?: "ACTIVE" | "OUT_OF_PRINT" | "FORTHCOMING" | null;
  countryOfPublication?: string | null;
  publisher?: { id: string; name: string } | null;
  imprintName?: string | null;
  series?: { id: string; title: string } | null;
  seriesNumber?: string | null;
  heightMm?: number | null;
  widthMm?: number | null;
  thicknessMm?: number | null;
  pageCount?: number | null;
  weightG?: number | null;
  volumeNumber?: number | null;
  isVerified: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PublicationCreatePayload = {
  work_id: string;
  isbn13?: string | null;
  title?: string | null;
  images?: string[] | null;
  language?: string | null;
  product_form?: ProductForm | string | null;
  volume_number?: number | null;
  edition?: string | null;
  edition_number?: number | null;
  published_date?: string | null;
  country_of_publication?: string | null;
  publishing_status?: "ACTIVE" | "OUT_OF_PRINT" | "FORTHCOMING" | null;
  publisher_id?: string | null;
  imprint_name?: string | null;
  series_id?: string | null;
  series_number?: string | null;
  height_mm?: number | null;
  width_mm?: number | null;
  thickness_mm?: number | null;
  page_count?: number | null;
  weight_g?: number | null;
};

export type PublicationUpdatePayload = {
  isbn13?: string | null;
  title?: string | null;
  images?: string[] | null;
  language?: string | null;
  product_form?: ProductForm | string | null;
  volume_number?: number | null;
  edition?: string | null;
  edition_number?: number | null;
  published_date?: string | null;
  country_of_publication?: string | null;
  publishing_status?: "ACTIVE" | "OUT_OF_PRINT" | "FORTHCOMING" | null;
  publisher_id?: string | null;
  imprint_name?: string | null;
  series_id?: string | null;
  series_number?: string | null;
  height_mm?: number | null;
  width_mm?: number | null;
  thickness_mm?: number | null;
  page_count?: number | null;
  weight_g?: number | null;
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
