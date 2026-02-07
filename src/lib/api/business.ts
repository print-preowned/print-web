import { apiFetch, generateUrl } from ".";
import { PaginatedResponse } from "./user";

export type Business = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function readBusinesses(params?: { page?: number; size?: number; search?: string }) {
  return generateUrl("/business/read", params);
}

export async function createBusiness(payload: {
  name: string;
  description?: string | null;
  logo?: string | null;
  status?: string;
}) {
  return { endpoint: "/business/create", method: "POST", body: payload };
}

export async function updateBusiness(
  id: string,
  payload: Partial<Omit<Business, "id" | "user_id" | "created_at" | "updated_at">>
) {
  return { endpoint: `/business/update/${id}`, method: "PUT", body: payload };
}

export async function deleteBusiness(id: string) {
  return { endpoint: `/business/delete/${id}`, method: "DELETE" };
}

export async function readBusinessById(id: string) {
  return generateUrl(`/business/read/by-id/${id}`);
}

export function readBusinessByUserId() {
  return generateUrl("/business/read/by-user-id");
}

