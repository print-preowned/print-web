import type { OrderFulfillmentStatus } from "@/lib/api/order";

export const SELLER_ORDER_NEXT_STATUSES: Record<
  string,
  OrderFulfillmentStatus[]
> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  ACTIVE: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function nextOrderStatuses(current: string): OrderFulfillmentStatus[] {
  return SELLER_ORDER_NEXT_STATUSES[current.trim().toUpperCase()] ?? [];
}

export function canUpdateOrderStatus(current: string): boolean {
  return nextOrderStatuses(current).length > 0;
}
