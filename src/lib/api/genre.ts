import { apiFetch, generateUrl } from ".";
import { PaginatedResponse } from "./user";
import { ReadParams, buildQueryParams } from "./types";

export type Genre = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function readGenres(params?: ReadParams) {
  const query = buildQueryParams(params);
  return { endpoint: "/genre/read", query };
}

/** Returns full URL for list (for use with apiFetch(url)). */
export function readGenresListUrl(params?: ReadParams) {
  const query = buildQueryParams(params);
  return generateUrl("/genre/read", query);
}

export async function createGenre(payload: {
  name: string;
  description?: string | null;
  status?: string;
}) {
  return { endpoint: "/genre/create", method: "POST", body: payload };
}

export async function updateGenre(
  id: string,
  payload: Partial<Omit<Genre, "id" | "created_at" | "updated_at">>
) {
  return { endpoint: `/genre/update/${id}`, method: "PUT", body: payload };
}

export function deleteGenre(id: string) {
  return { endpoint: `/genre/delete/${id}`, method: "DELETE" };
}

export async function readGenreById(id: string) {
  return generateUrl(`/genre/read/by-id/${id}`);
}
