import { generateUrl } from "@/lib/api";
import { uploadImageToStaging } from "@/lib/api/book-image";
import type { WorkTitle } from "@/lib/api/work-title";
import { firstImage } from "@/lib/cover";

export type PublicationLookup = {
  id: string;
  work?: {
    id: string;
    title: string;
    images?: string[] | null;
    authors?: { id?: string | null; name?: string | null; role?: string }[] | null;
  } | null;
  isbn13: string | null;
  title: string | null;
  images: string[];
  language: string | null;
  productForm?: string | null;
  volumeNumber?: number | null;
  editionStatement?: string | null;
  publishedDate?: string | null;
  pageCount?: number | null;
  weightG?: number | null;
  publisher?: { id: string; name: string } | null;
  isVerified?: boolean | null;
  status?: string | null;
};

/** Price and condition may be left out; the offer is then saved as a draft. */
export type InventoryOfferCreatePayload = {
  price?: string;
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
  /** New work only: a picked author links by id; a written name waits for staff to match it. */
  authors?: { id?: string; name?: string }[];
  offer: InventoryOfferCreatePayload;
  /** Omitted: live when complete, else draft. "ACTIVE" fails if incomplete. */
  status?: "DRAFT" | "ACTIVE";
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
  price: number | null;
  stock: number;
  currency: string;
  condition: string | null;
  signed: boolean | null;
  description: string | null;
  images: string[];
  status: string;
  /** What the offer still needs before it can go live. */
  missing: OfferRequirement[];
  /** Who added the offer; grantId is set when Print's onboarding team added it. */
  createdBy?: { userId: string; grantId?: string | null } | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type OfferRequirement = "price" | "stock" | "condition";

export function describeMissing(missing: OfferRequirement[]): string {
  return `Needs ${missing.join(", ")}`;
}

export type SellerListingStatusFilter = "DRAFT" | "ACTIVE" | "INACTIVE";

export type SellerInventoryUpdatePayload = {
  price?: string;
  stock?: number;
  condition?: string | null;
  signed?: boolean | null;
  description?: string | null;
  images?: string[] | null;
  status?: SellerListingStatusFilter;
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

export function readSellerInventory(params?: {
  page?: number;
  size?: number;
  search?: string;
  status?: SellerListingStatusFilter;
}) {
  return generateUrl("/seller-inventory", params);
}

export function readSellerInventoryStatusCounts() {
  return generateUrl("/seller-inventory/status-counts");
}

/** Matches the server's per-offer limit. */
export const MAX_OFFER_PHOTOS = 6;

export function uploadOfferPhotoToStaging(file: File) {
  return uploadImageToStaging("/seller-inventory/upload-url", file);
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
