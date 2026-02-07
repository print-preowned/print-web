import { apiFetch } from ".";

export type BookGenre = {
  id: string;
  book_id: string;
  genre_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type BookGenreListResponse = {
  status_code: number;
  message: string;
  data: BookGenre[];
};

export function createBookGenre(payload: { book_id: string; genre_id: string }) {
  return {
    endpoint: "/book-genre/create",
    method: "POST" as const,
    body: payload,
  };
}

export function deleteBookGenre(id: string) {
  return { endpoint: `/book-genre/delete/${id}`, method: "DELETE" as const };
}

export function readBookGenreByBook(bookId: string) {
  return `/book-genre/read/by-book/${bookId}`;
}

export function readBookGenreByGenre(genreId: string) {
  return `/book-genre/read/by-genre/${genreId}`;
}

export async function fetchBookGenreByBook(bookId: string) {
  const path = readBookGenreByBook(bookId);
  return apiFetch<BookGenreListResponse>(path);
}

export async function fetchBookGenreByGenre(genreId: string) {
  const path = readBookGenreByGenre(genreId);
  return apiFetch<BookGenreListResponse>(path);
}
