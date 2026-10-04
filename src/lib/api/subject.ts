import { generateUrl } from ".";
import { QueryFilter, ReadParams, buildQueryParams } from "./types";

export type SubjectScheme = "BISAC" | "THEMA" | "LCSH" | "OL_SUBJECT";

export type Subject = {
  id: string;
  scheme: SubjectScheme | string;
  code?: string | null;
  heading: string;
  normalizedHeading: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type SubjectWritePayload = {
  scheme: SubjectScheme;
  code?: string | null;
  heading: string;
};

export interface SubjectQueryFilter extends QueryFilter {
  scheme?: string;
}

export function readSubjectsListUrl(params?: ReadParams & { filter?: SubjectQueryFilter }) {
  return generateUrl("/subjects", buildQueryParams(params));
}

export function createSubject(payload: SubjectWritePayload) {
  return {
    endpoint: "/subjects",
    method: "POST" as const,
    body: payload,
  };
}

export function updateSubject(id: string, payload: Partial<SubjectWritePayload>) {
  return {
    endpoint: `/subjects/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteSubject(id: string) {
  return {
    endpoint: `/subjects/${id}`,
    method: "DELETE" as const,
  };
}
