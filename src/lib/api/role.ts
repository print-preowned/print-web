import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type Role = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function readRoles(params?: ReadParams) {
  const query = buildQueryParams(params);
  return generateUrl("/roles", query);
}

export function createRole(payload: {
  name: string;
  code?: string;
  description?: string | null;
  status?: string;
  privilege_codes?: string[];
}) {
  return {
    endpoint: "/roles",
    method: "POST" as const,
    body: payload,
  };
}

export function updateRole(
  id: string,
  payload: Partial<Pick<Role, "name" | "description" | "status">>,
) {
  return {
    endpoint: `/roles/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteRole(id: string) {
  return {
    endpoint: `/roles/${id}`,
    method: "DELETE" as const,
  };
}
