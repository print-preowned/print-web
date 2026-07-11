import { apiFetch, generateUrl } from ".";

export type BookAuthor = {
  id: string;
  book_id: string;
  author_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function createBookAuthor(
  bookId: string,
  payload: { author_id: string },
) {
  return {
    endpoint: `/books/${bookId}/authors`,
    method: "POST" as const,
    body: payload,
  };
}

export function deleteBookAuthor(bookId: string, authorId: string) {
  return {
    endpoint: `/books/${bookId}/authors/${authorId}`,
    method: "DELETE" as const,
  };
}

export function readBookAuthors(bookId: string) {
  return `/books/${bookId}/authors`;
}

export async function fetchBookAuthorByAuthor(authorId: string) {
  return apiFetch<{ data: BookAuthor[] }>(
    generateUrl(`/authors/${authorId}/books`),
  );
}
