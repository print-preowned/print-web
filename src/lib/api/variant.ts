import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type ResolvedConfig = {
  variant_type_id: string;
  variant_type_name: string;
  variant_option_id: string;
  variant_option_value: string;
};

export type Variant = {
  id: string;
  seller_book_id: string;
  description?: string | null;
  stock: number;
  price: number;
  currency: string;
  discount?: number | null;
  sku?: string | null;
  image?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type VariantWithConfig = Variant & {
  config: ResolvedConfig[];
};

export type VariantCreatePayload = {
  variant_option_ids: string[];
  stock: number;
  price: number;
  discount?: number | null;
  sku?: string | null;
  description?: string | null;
};

export type VariantUpdatePayload = Partial<
  Pick<
    Variant,
    "description" | "stock" | "price" | "discount" | "sku" | "status"
  >
>;

export function readVariants(sellerBookId: string, params?: ReadParams) {
  const query = buildQueryParams(params);
  return generateUrl(`/seller-books/${sellerBookId}/variants`, query);
}

export function createVariant(
  sellerBookId: string,
  payload: VariantCreatePayload,
) {
  return {
    endpoint: `/seller-books/${sellerBookId}/variants`,
    method: "POST" as const,
    body: payload,
  };
}

export function updateVariant(
  sellerBookId: string,
  variantId: string,
  payload: VariantUpdatePayload,
) {
  return {
    endpoint: `/seller-books/${sellerBookId}/variants/${variantId}`,
    method: "PATCH" as const,
    body: payload,
  };
}

export function deleteVariant(sellerBookId: string, variantId: string) {
  return {
    endpoint: `/seller-books/${sellerBookId}/variants/${variantId}`,
    method: "DELETE" as const,
  };
}

export function formatVariantConfig(config: ResolvedConfig[]): string {
  if (!config.length) return "—";
  return config.map((c) => c.variant_option_value).join(" · ");
}
