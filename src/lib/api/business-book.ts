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

export function readBusinessBooks(params?: ReadParams & { mine?: boolean }) {
  const query = buildQueryParams(params);
  if (params?.mine) {
    query.mine = "true";
  }
  return generateUrl("/business-books", query);
}

export function readBusinessBookById(id: string) {
  return generateUrl(`/business-books/${id}`);
}

export function createBusinessBook(payload: {
  book_id: string;
  synopsis?: string | null;
  image?: string | null;
}) {
  return {
    endpoint: "/business-books",
    method: "POST" as const,
    body: payload,
  };
}

export function updateBusinessBook(
  id: string,
  payload: Partial<Pick<BusinessBook, "synopsis" | "image" | "status">>,
) {
  return {
    endpoint: `/business-books/${id}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteBusinessBook(id: string) {
  return {
    endpoint: `/business-books/${id}`,
    method: "DELETE" as const,
  };
}
