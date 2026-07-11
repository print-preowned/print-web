import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

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
  return generateUrl("/authors", queryParams);
}

export function createAuthor(payload: {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  about: string;
  image: string;
  status?: string;
}) {
  return {
    endpoint: "/authors",
    method: "POST" as const,
    body: payload,
  };
}

export function updateAuthor(
  id: string,
  payload: Partial<Omit<Author, "_id" | "created_at" | "updated_at">>,
) {
  return {
    endpoint: `/authors/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function readAuthorById(id: string) {
  return generateUrl(`/authors/${id}`);
}
