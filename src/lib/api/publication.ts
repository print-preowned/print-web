import { generateUrl } from ".";

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
  binding: string;
  volume_number: number | null;
  edition: string | null;
  page_count: number | null;
  weight_grams: number | null;
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
  binding?: string;
  volume_number?: number | null;
  edition?: string | null;
  page_count?: number | null;
  weight_grams?: number | null;
};

export type PublicationUpdatePayload = {
  isbn13?: string | null;
  title?: string | null;
  image?: string | null;
  language?: string | null;
  binding?: string;
  volume_number?: number | null;
  edition?: string | null;
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
