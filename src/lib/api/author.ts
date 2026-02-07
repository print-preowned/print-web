import { apiFetch, generateUrl } from ".";
import { PaginatedResponse } from "./user";
import { QueryFilter, ReadParams, buildQueryParams } from "./types";

export type Author = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  about: string;
  image?: string | null;
  followers?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function readAuthors(params?: ReadParams) {
  const queryParams = buildQueryParams(params);
  return generateUrl("/author/read", queryParams);
}

export function createAuthor(payload: {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  about: string;
  image: string;
  status?: string;
}) {
  // Note: Backend controller uses GET for create (should be POST), but we'll use POST for consistency
  return { endpoint: "/author/create", method: "POST", body: payload };
}

export function updateAuthor(
  id: string,
  payload: Partial<Omit<Author, "_id" | "created_at" | "updated_at">>
) {
  return { endpoint: `/author/update/${id}`, method: "PUT" as const, body: payload };
}

// Authors cannot be deleted per MDC-AUTHOR-2
// export async function deleteAuthor(id: string) {
//   return { endpoint: `/author/delete/${id}`, method: "DELETE" };
// }

export function readAuthorById(id: string) {
  return generateUrl(`/author/read/by-id/${id}`);
}
