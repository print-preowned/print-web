type CustomerOrderStatusCopy = {
  headline: string;
  message: string;
};

const CUSTOMER_ORDER_STATUS_COPY: Record<string, CustomerOrderStatusCopy> = {
  PLACED: {
    headline: "Order placed",
    message: "We received your order and are waiting for the seller to confirm it.",
  },
  ACTIVE: {
    headline: "Order placed",
    message: "We received your order and are waiting for the seller to confirm it.",
  },
  CONFIRMED: {
    headline: "Confirmed",
    message: "Your order is confirmed and is being prepared.",
  },
  SHIPPED: {
    headline: "Shipped",
    message: "Your order is on the way.",
  },
  DELIVERED: {
    headline: "Delivered",
    message: "Your order was delivered.",
  },
  READY_FOR_PICKUP: {
    headline: "Ready for pickup",
    message: "Your order is ready to collect from the store.",
  },
  PICKED_UP: {
    headline: "Picked up",
    message: "Your order was collected.",
  },
  CANCELLED: {
    headline: "Cancelled",
    message: "Your order was cancelled. You have not been charged for this order.",
  },
};

export function getCustomerOrderStatusCopy(status: string): CustomerOrderStatusCopy {
  const key = status.trim().toUpperCase();
  return (
    CUSTOMER_ORDER_STATUS_COPY[key] ?? {
      headline: key
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      message: "Check order details for the latest update.",
    }
  );
}

export function formatOrderPlacedDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
