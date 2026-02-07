import { apiFetch, generateUrl } from ".";
import { PaginatedResponse } from "./user";
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
  /** Populated when reading books from the API */
  authors?: AuthorRef[];
  genres?: GenreRef[];
};

export function readBooks(params?: ReadParams) {
  const query = buildQueryParams(params);
  const url = generateUrl("/book/read", query);
  return url;
}

export async function createBook(payload: {
  title: string;
  image: string;
  synopsis: string;
}) {
  return { endpoint: "/book/create", method: "POST" as const, body: payload };
}

export async function updateBook(
  id: string,
  payload: Partial<Omit<Book, "id" | "created_at" | "updated_at">>
) {
  return { endpoint: `/book/update/${id}`, method: "PUT" as const, body: payload };
}

export function deleteBook(id: string) {
  return { endpoint: `/book/delete/${id}`, method: "DELETE" };
}

export async function readBookById(id: string) {
  return generateUrl(`/book/read/by-id/${id}`);
}