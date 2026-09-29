import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type Author = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  about: string;
  image?: string | null;
  followers?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function readAuthors(params?: ReadParams) {
  const queryParams = buildQueryParams(params);
  return generateUrl("/authors", queryParams);
}

export function createAuthor(payload: {
  firstName: string;
  lastName: string;
  middleName?: string | null;
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
  payload: Partial<Omit<Author, "_id" | "createdAt" | "updatedAt">>,
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
