import { apiFetch, generateUrl } from ".";

export type BookAuthor = {
  id: string;
  work_id: string;
  author_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function createBookAuthor(
  workId: string,
  payload: { author_id: string },
) {
  return {
    endpoint: `/works/${workId}/authors`,
    method: "POST" as const,
    body: payload,
  };
}

export function deleteBookAuthor(workId: string, authorId: string) {
  return {
    endpoint: `/works/${workId}/authors/${authorId}`,
    method: "DELETE" as const,
  };
}

export function readBookAuthors(workId: string) {
  return `/works/${workId}/authors`;
}

export async function fetchBookAuthorByAuthor(authorId: string) {
  return apiFetch<{ data: BookAuthor[] }>(
    generateUrl(`/authors/${authorId}/works`),
  );
}
