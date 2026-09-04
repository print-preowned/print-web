import { buildRelativeUrl } from "./core";
import { ReadParams, buildQueryParams } from "./types";

export type SellerOrderItem = {
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
  image?: string | null;
  author_names: string[];
};

export type OrderSummaryItemPreview = {
  id: string;
  book_title: string;
  image?: string | null;
  quantity: number;
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

export type OrderSummary = {
  id: string;
  reference: string;
  currency: string;
  status: string;
  payment_status: string;
  total_amount: number;
  item_count: number;
  preview_items: OrderSummaryItemPreview[];
  seller_id?: string | null;
  seller_name?: string | null;
  fulfillment_address?: OrderFulfillmentAddress | null;
  created_at: string;
  updated_at: string;
};

export type SellerOrderDetail = OrderSummary & {
  items: SellerOrderItem[];
};

export type OrderFulfillmentStatus =
  | "PLACED"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "CANCELLED";

export function readSellerOrders(params?: ReadParams) {
  return buildRelativeUrl("/seller-orders", buildQueryParams(params));
}

export function readSellerOrderById(id: string) {
  return buildRelativeUrl(`/seller-orders/${id}`);
}

export function updateSellerOrderStatus(
  id: string,
  status: OrderFulfillmentStatus,
) {
  return {
    endpoint: `/seller-orders/${id}/status`,
    method: "PATCH" as const,
    body: { status },
  };
}
