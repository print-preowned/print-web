import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type AuthorRef = { id: string; name: string };
export type GenreRef = { id: string; name: string };

export type Book = {
  id: string;
  title: string;
  image: string;
  synopsis: string;
  status: string;
  created_at: string;
  updated_at: string;
  authors?: AuthorRef[];
  genres?: GenreRef[];
};

export function readBooks(params?: ReadParams) {
  const query = buildQueryParams(params);
  return generateUrl("/books", query);
}

export type BookCreatePayload = {
  title: string;
  synopsis: string;
  image?: string;
  author_ids?: string[];
  genre_ids?: string[];
};

export function createBook(payload: BookCreatePayload) {
  return {
    endpoint: "/books",
    method: "POST" as const,
    body: payload,
  };
}

export function updateBook(
  id: string,
  payload: Partial<
    Omit<Book, "id" | "created_at" | "updated_at" | "authors" | "genres">
  > & {
    author_ids?: string[];
    genre_ids?: string[];
  },
) {
  return {
    endpoint: `/books/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteBook(id: string) {
  return {
    endpoint: `/books/${id}`,
    method: "DELETE",
  };
}

export function readBookById(id: string) {
  return generateUrl(`/books/${id}`);
}
