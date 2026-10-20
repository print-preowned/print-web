import { generateUrl } from ".";

export type Seller = {
  id: string;
  userId: string;
  legalEntityId?: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  payload: Partial<Omit<Seller, "id" | "userId" | "createdAt" | "updatedAt">>,
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
