import { apiFetch } from "@/lib/api";
import { buildRelativeUrl } from "@/lib/api/core";
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
  return buildRelativeUrl(`/books/${bookId}/offers`, query);
}

export function readPublicStoreInventory(
  businessId: string,
  params?: ReadParams,
) {
  return buildRelativeUrl(
    `/businesses/${businessId}/storefront/catalog`,
    buildQueryParams(params),
  );
}

export function readPublicBusinessProfile(businessId: string) {
  return buildRelativeUrl(`/businesses/${businessId}/storefront`);
}

export function readPublicBusinessBookById(id: string) {
  return buildRelativeUrl(`/offers/${id}`);
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

export type OrderPaymentStatus = "NONE" | "PENDING" | "PAID" | "REFUNDED";

export type Order = {
  id: string;
  user_id: string;
  reference: string;
  currency: string;
  total_amount: number;
  status: string;
  payment_status: OrderPaymentStatus;
  business_id?: string | null;
  business_name?: string | null;
  fulfillment_address?: OrderFulfillmentAddress | null;
  created_at: string;
};

export type OrderDetail = Order & {
  items: OrderItem[];
  can_open_dispute?: boolean;
};

export type DisputeStatus = "OPEN" | "RESOLVED_REFUND" | "RESOLVED_RELEASE";

export type OrderDispute = {
  id: string;
  order_id: string;
  reason: string;
  dispute_status: DisputeStatus;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderDisputeCreatePayload = {
  reason: string;
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

export type BaseResponse<T> = {
  status_code: number;
  message: string;
  data: T;
};

export function readOrderById(id: string) {
  return buildRelativeUrl(`/orders/${id}`);
}

export function readCustomerOrders(params?: { page?: number; size?: number; search?: string }) {
  return buildRelativeUrl("/orders", buildQueryParams(params));
}

export async function createOrder(payload: OrderCreatePayload) {
  return apiFetch<BaseResponse<OrderDetail>>("/orders", {
    method: "POST",
    body: payload,
  });
}

export async function cancelOrder(id: string) {
  return apiFetch<void>(`/orders/${id}/cancel`, {
    method: "POST",
  });
}

export function readOrderDisputes(orderId: string) {
  return buildRelativeUrl(`/orders/${orderId}/disputes`);
}

export async function openOrderDispute(
  orderId: string,
  payload: OrderDisputeCreatePayload,
) {
  return apiFetch<BaseResponse<OrderDispute>>(
    `/orders/${orderId}/disputes`,
    {
      method: "POST",
      body: payload,
    },
  );
}


export type PaymentInitiatePayload = {
  checkout_type?: "STANDARD";
  redirect_url: string;
};

export type PaymentInitiateResponse = {
  payment_id: string;
  reference: string;
  amount: number;
  currency: string;
  checkout_type: string;
  provider_charge_id?: string | null;
  checkout_url?: string | null;
};

export async function initiateOrderPayment(
  orderId: string,
  payload: PaymentInitiatePayload,
) {
  return apiFetch<BaseResponse<PaymentInitiateResponse>>(
    `/orders/${orderId}/payments`,
    {
      method: "POST",
      body: payload,
    },
  );
}
