import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";
import type { BusinessBookListingStatus } from "@/lib/business-book-listing-status";

export type BusinessBook = {
  id: string;
  book_id: string;
  business_id: string;
  synopsis?: string | null;
  image?: string | null;
  status: BusinessBookListingStatus;
  created_at: string;
  updated_at: string;
  book_title?: string | null;
  book_image?: string | null;
  variant_count?: number;
  min_price?: number | null;
  total_stock?: number;
};

export type BusinessBookWithVariants = BusinessBook & {
  variants?: import("./variant").VariantWithConfig[];
};

/** Build URL for listing current business's catalog (GET). Requires BUSINESS context. */
export function readBusinessBooks(params?: ReadParams) {
  const query = buildQueryParams(params);
  return generateUrl("/business-book/read", query);
}

export function readBusinessBookById(id: string) {
  return generateUrl(`/business-book/read/by-id/${id}`);
}

/** Create a business_book (add book to my catalog). Server injects business_id from token. */
export function createBusinessBook(payload: {
  book_id: string;
  synopsis?: string | null;
  image?: string | null;
}) {
  return {
    endpoint: "/business-book/create",
    method: "POST" as const,
    body: payload,
  };
}

export function updateBusinessBook(
  id: string,
  payload: Partial<Pick<BusinessBook, "synopsis" | "image" | "status">>
) {
  return {
    endpoint: `/business-book/update/${id}`,
    method: "PUT" as const,
    body: payload,
  };
}

export function deleteBusinessBook(id: string) {
  return { endpoint: `/business-book/delete/${id}`, method: "DELETE" as const };
}
