import { apiFetch, generateUrl } from "@/lib/api";
import { ReadParams, buildQueryParams } from "@/lib/api/types";
import type { ResolvedConfig } from "@/lib/api/variant";

/** Display helper — server uses a single default currency today. */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export type PublicCatalogVariant = {
  id: string;
  business_book_id: string;
  book_id: string;
  book_title: string;
  book_image?: string | null;
  business_id: string;
  business_name: string;
  price: number;
  currency: string;
  discount?: number | null;
  stock: number;
  image?: string | null;
  config: ResolvedConfig[];
};

export type PublicCatalogBusinessBook = {
  id: string;
  book_id: string;
  business_id: string;
  business_name: string;
  book_title: string;
  book_image?: string | null;
  synopsis?: string | null;
  image?: string | null;
  author_names: string[];
  variant_count: number;
  min_price?: number | null;
};

export type PublicCatalogBusinessBookDetail = PublicCatalogBusinessBook & {
  variants: PublicCatalogVariant[];
};

export function readPublicBusinessBooks(
  params?: ReadParams & { book_id?: string; exclude_id?: string },
) {
  const query = buildQueryParams(params);
  if (params?.book_id) query.book_id = params.book_id;
  if (params?.exclude_id) query.exclude_id = params.exclude_id;
  return generateUrl("/business-books", query);
}

export function readPublicBusinessBookById(id: string) {
  return generateUrl(`/business-books/${id}`);
}

export type OrderItem = {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  currency: string;
  discount_applied?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  book_title: string;
  book_id: string;
  image?: string | null;
  business_name: string;
  author_names: string[];
};

export type Order = {
  id: string;
  user_id: string;
  reference: string;
  currency: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type OrderDetail = Order & {
  items: OrderItem[];
};

export type OrderCreatePayload = {
  reference: string;
  total_amount: number;
  items: OrderItemCreatePayload[];
};

export type OrderItemCreatePayload = {
  variant_id: string;
  quantity: number;
  unit_price: number;
  discount_applied?: number | null;
};

type BaseResponse<T> = {
  status_code: number;
  message: string;
  data: T;
};

export function readOrderById(id: string) {
  return generateUrl(`/orders/${id}`);
}

export function readCustomerOrders(params?: { page?: number; size?: number; search?: string }) {
  return generateUrl("/orders", buildQueryParams(params));
}

export async function createOrder(payload: OrderCreatePayload) {
  return apiFetch<BaseResponse<OrderDetail>>("/orders", {
    method: "POST",
    body: payload,
  });
}

export async function fetchOrderById(id: string, token: string) {
  return apiFetch<BaseResponse<OrderDetail>>(readOrderById(id), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cancelOrder(id: string) {
  return apiFetch<void>(`/orders/${id}/cancel`, {
    method: "POST",
  });
}
