import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type Publisher = {
  id: string;
  name: string;
  normalizedName: string;
  parentId?: string | null;
  parentName?: string | null;
  countryCode?: string | null;
  externalIds?: Record<string, string>;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type PublisherWritePayload = {
  name: string;
  parent_id?: string | null;
  country_code?: string | null;
  status?: string;
};

export function readPublishersListUrl(params?: ReadParams) {
  return generateUrl("/publishers", buildQueryParams(params));
}

export function createPublisher(payload: PublisherWritePayload) {
  return {
    endpoint: "/publishers",
    method: "POST" as const,
    body: payload,
  };
}

export function updatePublisher(id: string, payload: Partial<PublisherWritePayload>) {
  return {
    endpoint: `/publishers/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deletePublisher(id: string) {
  return {
    endpoint: `/publishers/${id}`,
    method: "DELETE" as const,
  };
}
