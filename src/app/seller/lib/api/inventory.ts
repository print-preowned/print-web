import { generateUrl } from "@/lib/api";
import type { WorkTitle } from "@/lib/api/work-title";
import { firstImage } from "@/lib/cover";

export type PublicationLookup = {
  id: string;
  work_id: string;
  isbn13: string | null;
  title: string | null;
  images: string[];
  language: string | null;
  productForm?: string | null;
  binding?: string | null;
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
  images?: string[];
};

export type InventoryCreatePayload = {
  publication_id?: string;
  isbn?: string;
  work_id?: string;
  title?: string;
  language?: string;
  product_form?: string;
  description?: string;
  offer: InventoryOfferCreatePayload;
};

export type WorkRef = {
  id: string;
  title: string;
  images?: string[] | null;
  authors?: { id: string; name?: string | null }[];
};

export type PublicationRef = {
  id: string;
  language: string | null;
  productForm: string;
  volumeNumber: number | null;
  edition: string | null;
  title: string | null;
  images: string[];
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
  images: string[];
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
  images?: string[] | null;
  status?: string;
};

export function inventoryTitle(item: SellerInventory) {
  return (item.publication.title || item.work.title || "").trim();
}

export function inventoryImage(item: SellerInventory) {
  return (
    firstImage(item.images) ||
    firstImage(item.publication.images) ||
    firstImage(item.work.images)
  );
}

export function readPublicationByIsbn(isbn: string) {
  return generateUrl("/publications", { isbn });
}

export type CatalogWork = {
  id: string;
  title: WorkTitle;
  images: string[];
  description: string | null;
  language: string | null;
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
