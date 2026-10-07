import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";
import type { WorkTitle } from "./work-title";

export type { WorkTitle } from "./work-title";

export type AuthorRef = {
  id?: string;
  name: string;
  role?: string;
  sequence?: number | null;
  unnamed?: string | null;
};

export type GenreRef = { id: string; name: string };

export type Book = {
  id: string;
  title: WorkTitle;
  images: string[];
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  authors?: AuthorRef[];
  genres?: GenreRef[];
};

export function readBooks(params?: ReadParams) {
  const query = buildQueryParams(params);
  return generateUrl("/works", query);
}

export type BookCreatePayload = {
  title: string;
  titlePrefix?: string;
  subtitle?: string;
  description: string;
  images?: string[];
  authorIds?: string[];
  genreIds?: string[];
};

export function createBook(payload: BookCreatePayload) {
  return {
    endpoint: "/works",
    method: "POST" as const,
    body: payload,
  };
}

export function updateBook(
  id: string,
  payload: Partial<BookCreatePayload> & {
    authorIds?: string[];
    genreIds?: string[];
    status?: string;
  },
) {
  return {
    endpoint: `/works/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteBook(id: string) {
  return {
    endpoint: `/works/${id}`,
    method: "DELETE",
  };
}

export function readBookById(id: string) {
  return generateUrl(`/works/${id}`);
}
