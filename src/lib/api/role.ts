import { apiFetch } from ".";

export type Role = {
  _id: string;
  name: string;
  description?: string | null;
};

export type PaginatedResponse<T> = {
  status_code: number;
  message: string;
  data: T[];
  pagination?: {
    page: number;
    size: number;
    total_pages: number;
    total_results: number;
  } | null;
};

export async function readRoles(params: { page?: number; size?: number; search?: string }) {
  return apiFetch<PaginatedResponse<Role>>("/role/read", { query: params });
}

export async function createRole(payload: { name: string; description?: string | null }) {
  return apiFetch("/role/create", { method: "POST", body: payload });
}

export async function updateRole(id: string, payload: Partial<{ name: string; description?: string | null }>) {
  return apiFetch(`/role/update/${id}`, { method: "PUT", body: payload });
}

export async function deleteRole(id: string) {
  return apiFetch(`/role/delete/${id}`, { method: "DELETE" });
}



