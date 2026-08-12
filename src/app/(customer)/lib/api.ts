import { apiFetch, generateUrl } from "@/lib/api";
export { formatPrice } from "@/lib/format-price";
import { ReadParams, buildQueryParams } from "@/lib/api/types";
import type { ResolvedConfig } from "@/lib/api/variant";

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

export type PublicBusinessProfile = {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
};

export function readOffers(
  bookId: string,
  params?: ReadParams & { exclude_id?: string },
) {
  const query = buildQueryParams(params);
  if (params?.exclude_id) query.exclude_id = params.exclude_id;
  return generateUrl(`/books/${bookId}/offers`, query);
}

export function readPublicStoreInventory(
  businessId: string,
  params?: ReadParams,
) {
  return generateUrl(
    `/businesses/${businessId}/storefront/catalog`,
    buildQueryParams(params),
  );
}

export function readPublicBusinessProfile(businessId: string) {
  return generateUrl(`/businesses/${businessId}/storefront`);
}

export function readPublicBusinessBookById(id: string) {
  return generateUrl(`/offers/${id}`);
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

export type OrderFulfillmentAddress = {
  fulfillment_type: string;
  recipient_name: string;
  address_label?: string | null;
  phone_number?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code?: string | null;
  country_code: string;
};

export type Order = {
  id: string;
  user_id: string;
  reference: string;
  currency: string;
  total_amount: number;
  status: string;
  business_id?: string | null;
  business_name?: string | null;
  fulfillment_address?: OrderFulfillmentAddress | null;
  created_at: string;
};

export type OrderDetail = Order & {
  items: OrderItem[];
};

export type OrderCreatePayload = {
  reference: string;
  total_amount: number;
  fulfillment_type?: "DELIVERY" | "PICKUP";
  shipping_address_id?: string;
  pickup_location_id?: string;
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
