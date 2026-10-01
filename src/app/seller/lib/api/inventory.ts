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

export type InventoryOfferCreatePayload = {
  price: string;
  stock: number;
  condition?: string;
  signed?: boolean;
  currency?: string;
  description?: string;
  image?: string;
};

export type InventoryCreatePayload = {
  publication_id?: string;
  isbn?: string;
  work_id?: string;
  title?: string;
  language?: string;
  binding?: string;
  description?: string;
  offer: InventoryOfferCreatePayload;
};

export type WorkRef = {
  id: string;
  title: string;
  image?: string | null;
  authors?: { id: string; name?: string | null }[];
};

export type PublicationRef = {
  id: string;
  language: string | null;
  binding: string;
  volumeNumber: number | null;
  edition: string | null;
  title: string | null;
  image: string | null;
};

export type SellerRef = {
  id: string;
  name: string;
  status?: string;
};

export type SellerInventory = {
  id: string;
  seller: SellerRef;
  work: WorkRef;
  publication: PublicationRef;
  price: number;
  stock: number;
  currency: string;
  condition: string | null;
  signed: boolean | null;
  description: string | null;
  image: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
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

export function inventoryTitle(item: SellerInventory) {
  return (item.publication.title || item.work.title || "").trim();
}

export function inventoryImage(item: SellerInventory) {
  return item.image || item.publication.image || item.work.image || null;
}

export function readPublicationByIsbn(isbn: string) {
  return generateUrl("/publications", { isbn });
}

export type CatalogWork = {
  id: string;
  title: string;
  image: string | null;
  description: string | null;
  original_language: string | null;
  status: string;
  authors?: { id: string; name: string }[];
};

export function readWorks(params?: { page?: number; size?: number; search?: string }) {
  return generateUrl("/works", params);
}

export function readWorkPublications(workId: string) {
  return generateUrl(`/works/${workId}/publications`);
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
