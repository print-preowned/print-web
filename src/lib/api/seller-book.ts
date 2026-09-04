import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";
import type { SellerBookListingStatus } from "@/lib/seller-book-listing-status";

export type SellerBook = {
  id: string;
  book_id: string;
  seller_id: string;
  synopsis?: string | null;
  image?: string | null;
  status: SellerBookListingStatus;
  created_at: string;
  updated_at: string;
  book_title?: string | null;
  book_image?: string | null;
  variant_count?: number;
  min_price?: number | null;
  total_stock?: number;
};

export type SellerBookWithVariants = SellerBook & {
  variants?: import("./variant").VariantWithConfig[];
};

export function readSellerBooks(params?: ReadParams) {
  return generateUrl("/seller-books", buildQueryParams(params));
}

export function readSellerBookById(id: string) {
  return generateUrl(`/seller-books/${id}`);
}

export function createSellerBook(payload: {
  book_id: string;
  synopsis?: string | null;
  image?: string | null;
}) {
  return {
    endpoint: "/seller-books",
    method: "POST" as const,
    body: payload,
  };
}

export function updateSellerBook(
  id: string,
  payload: Partial<Pick<SellerBook, "synopsis" | "image" | "status">>,
) {
  return {
    endpoint: `/seller-books/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteSellerBook(id: string) {
  return {
    endpoint: `/seller-books/${id}`,
    method: "DELETE" as const,
  };
}
