import { generateUrl } from ".";
import { ReadParams, buildQueryParams } from "./types";

export type BusinessOrderItem = {
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
  total_amount: number;
  item_count: number;
  preview_items: OrderSummaryItemPreview[];
  business_id?: string | null;
  business_name?: string | null;
  fulfillment_address?: OrderFulfillmentAddress | null;
  created_at: string;
  updated_at: string;
};

export type BusinessOrderDetail = OrderSummary & {
  items: BusinessOrderItem[];
};

export type OrderFulfillmentStatus =
  | "PLACED"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export function readBusinessOrders(params?: ReadParams) {
  return generateUrl("/business-orders", buildQueryParams(params));
}

export function readBusinessOrderById(id: string) {
  return generateUrl(`/business-orders/${id}`);
}

export function updateBusinessOrderStatus(
  id: string,
  status: OrderFulfillmentStatus,
) {
  return {
    endpoint: `/business-orders/${id}/status`,
    method: "PATCH" as const,
    body: { status },
  };
}

export function formatOrderAmount(amount: number, currency = "NGN"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
