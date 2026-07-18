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
};

export type BusinessOrderSummary = {
  id: string;
  reference: string;
  currency: string;
  status: string;
  business_total_amount: number;
  item_count: number;
  created_at: string;
  updated_at: string;
};

export type BusinessOrderDetail = BusinessOrderSummary & {
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
