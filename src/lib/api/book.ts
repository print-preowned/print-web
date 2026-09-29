import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type AuthorRef = { id: string; name: string };
export type GenreRef = { id: string; name: string };

export type Book = {
  id: string;
  title: string;
  image: string;
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
  description: string;
  image?: string;
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
  payload: Partial<
    Omit<Book, "id" | "createdAt" | "updatedAt" | "authors" | "genres">
  > & {
    authorIds?: string[];
    genreIds?: string[];
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
