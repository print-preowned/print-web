import { apiFetch } from ".";

export type BookAuthor = {
  id: string;
  book_id: string;
  author_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type BookAuthorListResponse = {
  status_code: number;
  message: string;
  data: BookAuthor[];
};

export function createBookAuthor(payload: { book_id: string; author_id: string }) {
  return {
    endpoint: "/book-author/create",
    method: "POST" as const,
    body: payload,
  };
}

export function deleteBookAuthor(id: string) {
  return { endpoint: `/book-author/delete/${id}`, method: "DELETE" as const };
}

export function readBookAuthorByBook(bookId: string) {
  return `/book-author/read/by-book/${bookId}`;
}

export function readBookAuthorByAuthor(authorId: string) {
  return `/book-author/read/by-author/${authorId}`;
}

export async function fetchBookAuthorByBook(bookId: string) {
  const path = readBookAuthorByBook(bookId);
  return apiFetch<BookAuthorListResponse>(path);
}

export async function fetchBookAuthorByAuthor(authorId: string) {
  const path = readBookAuthorByAuthor(authorId);
  return apiFetch<BookAuthorListResponse>(path);
}
