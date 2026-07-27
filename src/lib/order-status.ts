import type { OrderFulfillmentStatus } from "@/lib/api/order";

const DELIVERY_ONLY_STATUSES = new Set<OrderFulfillmentStatus>([
  "SHIPPED",
  "DELIVERED",
]);

const PICKUP_ONLY_STATUSES = new Set<OrderFulfillmentStatus>([
  "READY_FOR_PICKUP",
  "PICKED_UP",
]);

export const SELLER_ORDER_NEXT_STATUSES: Record<
  string,
  OrderFulfillmentStatus[]
> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  ACTIVE: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "READY_FOR_PICKUP", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  READY_FOR_PICKUP: ["PICKED_UP"],
  PICKED_UP: [],
  CANCELLED: [],
};

export function nextOrderStatuses(
  current: string,
  fulfillmentType = "DELIVERY",
): OrderFulfillmentStatus[] {
  const normalizedFulfillment = fulfillmentType.trim().toUpperCase();
  const options =
    SELLER_ORDER_NEXT_STATUSES[current.trim().toUpperCase()] ?? [];

  return options.filter((status) => {
    if (DELIVERY_ONLY_STATUSES.has(status)) {
      return normalizedFulfillment === "DELIVERY";
    }
    if (PICKUP_ONLY_STATUSES.has(status)) {
      return normalizedFulfillment === "PICKUP";
    }
    return true;
  });
}

export function canUpdateOrderStatus(
  current: string,
  fulfillmentType = "DELIVERY",
): boolean {
  return nextOrderStatuses(current, fulfillmentType).length > 0;
}

export const CUSTOMER_CANCELLABLE_ORDER_STATUSES = new Set([
  "PLACED",
  "CONFIRMED",
]);

export function canCustomerCancelOrder(status: string): boolean {
  return CUSTOMER_CANCELLABLE_ORDER_STATUSES.has(status.trim().toUpperCase());
}
