import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type Series = {
  id: string;
  title: string;
  normalizedTitle: string;
  issn?: string | null;
  publisherId?: string | null;
  publisherName?: string | null;
  externalIds?: Record<string, string>;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type SeriesWritePayload = {
  title: string;
  issn?: string | null;
  publisher_id?: string | null;
  status?: string;
};

export function readSeriesListUrl(params?: ReadParams) {
  return generateUrl("/series", buildQueryParams(params));
}

export function createSeries(payload: SeriesWritePayload) {
  return {
    endpoint: "/series",
    method: "POST" as const,
    body: payload,
  };
}

export function updateSeries(id: string, payload: Partial<SeriesWritePayload>) {
  return {
    endpoint: `/series/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteSeries(id: string) {
  return {
    endpoint: `/series/${id}`,
    method: "DELETE" as const,
  };
}
