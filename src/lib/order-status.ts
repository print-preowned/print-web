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

export function isOrderAwaitingPayment(paymentStatus?: string): boolean {
  return paymentStatus?.trim().toUpperCase() === "PENDING";
}

/** Seller may advance fulfillment only after payment is complete (or not required). */
export function canSellerFulfillOrder(paymentStatus?: string): boolean {
  const normalized = paymentStatus?.trim().toUpperCase() ?? "NONE";
  return normalized === "NONE" || normalized === "PAID";
}

export function canUpdateOrderStatus(
  current: string,
  fulfillmentType = "DELIVERY",
  paymentStatus?: string,
): boolean {
  if (!canSellerFulfillOrder(paymentStatus)) {
    return false;
  }
  return nextOrderStatuses(current, fulfillmentType).length > 0;
}

export function getSellerPaymentStatusBadgeLabel(
  paymentStatus: string,
): string | undefined {
  if (paymentStatus.trim().toUpperCase() === "PENDING") {
    return "Awaiting payment";
  }
  return undefined;
}

export function getSellerPaymentBlockedMessage(paymentStatus?: string): string | null {
  const normalized = paymentStatus?.trim().toUpperCase() ?? "NONE";
  if (normalized === "PENDING") {
    return "This order is awaiting customer payment. Fulfillment updates are disabled until payment is complete.";
  }
  if (normalized === "REFUNDED") {
    return "Payment was refunded. Fulfillment updates are disabled.";
  }
  if (!canSellerFulfillOrder(paymentStatus)) {
    return "Payment is not complete. Fulfillment updates are disabled.";
  }
  return null;
}

export const CUSTOMER_CANCELLABLE_ORDER_STATUSES = new Set([
  "PLACED",
  "CONFIRMED",
]);

export function canCustomerCancelOrder(status: string): boolean {
  return CUSTOMER_CANCELLABLE_ORDER_STATUSES.has(status.trim().toUpperCase());
}

export function getCustomerCancelConfirmDescription(
  paymentStatus?: string,
): string {
  if (isOrderAwaitingPayment(paymentStatus)) {
    return "This unpaid order will be cancelled. No payment has been taken.";
  }
  return "Items will be returned to stock and this cannot be undone.";
}
