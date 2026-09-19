import { apiFetch, generateUrl } from ".";

export type WorkAuthor = {
  id: string;
  work_id: string;
  author_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function createWorkAuthor(
  workId: string,
  payload: { author_id: string },
) {
  return {
    endpoint: `/works/${workId}/authors`,
    method: "POST" as const,
    body: payload,
  };
}

export function deleteWorkAuthor(workId: string, authorId: string) {
  return {
    endpoint: `/works/${workId}/authors/${authorId}`,
    method: "DELETE" as const,
  };
}

export function readWorkAuthors(workId: string) {
  return `/works/${workId}/authors`;
}

export async function fetchWorkAuthorByAuthor(authorId: string) {
  return apiFetch<{ data: WorkAuthor[] }>(
    generateUrl(`/authors/${authorId}/works`),
  );
}
