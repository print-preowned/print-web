import { generateUrl } from "@/lib/api";

export type PublicationLookup = {
  id: string;
  work_id: string;
  isbn13: string | null;
  title: string | null;
  image: string | null;
  language: string | null;
  binding: string;
  volume_number: number | null;
  edition: string | null;
  page_count: number | null;
  weight_grams: number | null;
  is_verified: boolean;
  status: string;
};

export type InventoryCreatePayload = {
  publication_id?: string;
  isbn?: string;
  work_id?: string;
  work?: {
    title: string;
    original_language?: string;
    synopsis?: string;
    image?: string;
  };
  language?: string;
  binding?: string;
  price: string;
  stock: number;
  condition?: string;
  signed?: boolean;
  currency?: string;
  description?: string;
  image?: string;
};

export type InventoryCreateResponse = {
  id: string;
  publication_id: string;
};

export type SellerInventoryListItem = {
  id: string;
  seller_id: string;
  publication_id: string;
  work_id: string | null;
  title: string;
  image: string | null;
  price: number;
  stock: number;
  currency: string;
  condition: string | null;
  signed: boolean | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SellerInventoryUpdatePayload = {
  price?: string;
  stock?: number;
  condition?: string | null;
  signed?: boolean | null;
  description?: string | null;
  image?: string | null;
  status?: string;
};

export function readPublicationByIsbn(isbn: string) {
  return generateUrl("/publications", { isbn });
}

export function readSellerInventory(params?: { page?: number; size?: number; search?: string }) {
  return generateUrl("/seller-inventory", params);
}

export function createInventory(payload: InventoryCreatePayload) {
  return {
    endpoint: "/seller-inventory",
    method: "POST" as const,
    body: payload,
  };
}

export function updateSellerInventory(id: string, payload: SellerInventoryUpdatePayload) {
  return {
    endpoint: `/seller-inventory/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteSellerInventory(id: string) {
  return {
    endpoint: `/seller-inventory/${id}`,
    method: "DELETE" as const,
  };
}
