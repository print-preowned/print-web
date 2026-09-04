import { generateUrl } from ".";

export type Seller = {
  id: string;
  user_id: string;
  legal_entity_id?: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function readSellers() {
  return generateUrl("/sellers");
}

export function createSeller(payload: {
  name: string;
  description?: string | null;
  logo?: string | null;
  status?: string;
}) {
  return { endpoint: "/api/sellers", method: "POST" as const, body: payload };
}

export function updateSeller(
  id: string,
  payload: Partial<Omit<Seller, "id" | "user_id" | "created_at" | "updated_at">>,
): { endpoint: string; method: "PATCH"; body: typeof payload } {
  return { endpoint: `/sellers/${id}`, method: "PATCH", body: payload };
}

export function deleteSeller(id: string) {
  return { endpoint: `/api/sellers/${id}`, method: "DELETE" as const };
}

export function readSellerById(id: string) {
  return generateUrl(`/sellers/${id}`);
}

export function readSellerByUserId() {
  return generateUrl("/sellers/me");
}
