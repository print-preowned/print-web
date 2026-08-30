import { SELLER_PAYMENTS_UNAVAILABLE } from "@/lib/payment-errors";
import { apiFetch } from "@/lib/api";
import {
  readOrderById,
  type BaseResponse,
  type OrderDetail,
  type OrderPaymentStatus,
  type PaymentInitiateResponse,
} from "@customer/api";

function buildPublicAppUrl(path: string): string {
  let baseUrl = "";
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) {
    baseUrl = configured;
  }
  if (typeof window !== "undefined" && !baseUrl) {
    baseUrl = window.location.origin;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalized}` : normalized;
}

/** Customer return URL after Flutterwave redirect checkout (must be HTTPS in sandbox/live). */
export function buildPaymentReturnUrl(orderId: string): string {
  return buildPublicAppUrl(`/orders/${orderId}?payment=return`);
}

export function buildStandardCheckoutPayload(redirectUrl: string) {
  return {
    checkout_type: "STANDARD" as const,
    redirect_url: redirectUrl,
  };
}

/** @deprecated Use buildStandardCheckoutPayload */
export function buildCheckoutSessionPayload(redirectUrl: string) {
  return buildStandardCheckoutPayload(redirectUrl);
}

export type PaymentCheckoutStart =
  | { type: "redirect"; url: string }
  | { type: "pending"; response: PaymentInitiateResponse };

export function startPaymentCheckout(
  response: PaymentInitiateResponse,
): PaymentCheckoutStart {
  if (response.checkout_url) {
    return { type: "redirect", url: response.checkout_url };
  }
  return { type: "pending", response };
}

export function applyPaymentCheckoutStart(start: PaymentCheckoutStart): boolean {
  if (start.type === "redirect") {
    window.location.assign(start.url);
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function fetchOrderPaymentStatus(
  orderId: string,
): Promise<OrderPaymentStatus> {
  const res = await apiFetch<BaseResponse<OrderDetail>>(readOrderById(orderId));
  return res.data.payment_status;
}

export type PollOrderPaymentOptions = {
  maxAttempts?: number;
  intervalMs?: number;
  onPaid?: () => void;
  onRefunded?: () => void;
  onTimeout?: () => void;
};

/** Poll until payment settles, times out, or `signal` aborts. */
export async function pollOrderPaymentStatus(
  orderId: string,
  options: PollOrderPaymentOptions = {},
  signal?: AbortSignal,
): Promise<void> {
  const maxAttempts = options.maxAttempts ?? 15;
  const intervalMs = options.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      return;
    }

    try {
      const status = await fetchOrderPaymentStatus(orderId);
      if (status === "PAID") {
        options.onPaid?.();
        return;
      }
      if (status === "REFUNDED") {
        options.onRefunded?.();
        return;
      }
    } catch {
      // Webhook may still be in flight; retry.
    }

    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs);
    }
  }

  if (!signal?.aborted) {
    options.onTimeout?.();
  }
}

export { SELLER_PAYMENTS_UNAVAILABLE };
