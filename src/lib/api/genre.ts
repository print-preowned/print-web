import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type Genre = {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  parentName?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function readGenres(params?: ReadParams) {
  const query = buildQueryParams(params);
  return { endpoint: "/genres", query };
}

export function readGenresListUrl(params?: ReadParams) {
  const query = buildQueryParams(params);
  return generateUrl("/genres", query);
}

export function createGenre(payload: {
  name: string;
  description?: string | null;
  parent_id?: string | null;
  status?: string;
}) {
  return {
    endpoint: "/genres",
    method: "POST" as const,
    body: payload,
  };
}

export function updateGenre(
  id: string,
  payload: Partial<{
    name: string;
    description?: string | null;
    parent_id?: string | null;
    status?: string;
  }>,
) {
  return {
    endpoint: `/genres/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteGenre(id: string) {
  return {
    endpoint: `/genres/${id}`,
    method: "DELETE",
  };
}

export function readGenreById(id: string) {
  return generateUrl(`/genres/${id}`);
}
