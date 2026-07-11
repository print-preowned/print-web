import { generateUrl } from ".";

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
  return generateUrl("/businesses", params);
}

export function createBusiness(payload: {
  name: string;
  description?: string | null;
  logo?: string | null;
  status?: string;
}) {
  return { endpoint: "/api/business/create", method: "POST" as const, body: payload };
}

export function updateBusiness(
  id: string,
  payload: Partial<Omit<Business, "id" | "user_id" | "created_at" | "updated_at">>,
): { endpoint: string; method: "PATCH"; body: typeof payload } {
  return { endpoint: `/businesses/${id}`, method: "PATCH", body: payload };
}

export function deleteBusiness(id: string) {
  return { endpoint: `/businesses/${id}`, method: "DELETE" as const };
}

export function readBusinessById(id: string) {
  return generateUrl(`/businesses/${id}`);
}

export function readBusinessByUserId() {
  return generateUrl("/businesses/me");
}
