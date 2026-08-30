"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format-price";
import { paymentErrorMessage } from "@/lib/payment-errors";
import {
  applyPaymentCheckoutStart,
  buildStandardCheckoutPayload,
  buildPaymentReturnUrl,
  pollOrderPaymentStatus,
  startPaymentCheckout,
} from "@/lib/payment-checkout";
import { initiateOrderPayment, type OrderPaymentStatus } from "@customer/api";

type Props = {
  orderId: string;
  paymentStatus: OrderPaymentStatus;
  totalAmount: number;
  currency: string;
};

export function OrderPaymentPanel({
  orderId,
  paymentStatus,
  totalAmount,
  currency,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paying, setPaying] = useState(false);
  const returnPollStarted = useRef(false);

  useEffect(() => {
    if (paymentStatus !== "PENDING") {
      return;
    }

    const controller = new AbortController();
    const fromReturn = searchParams.get("payment") === "return";

    if (fromReturn && !returnPollStarted.current) {
      returnPollStarted.current = true;
      router.replace(`/orders/${orderId}`);
      toast.message("Confirming payment…");
    }

    void pollOrderPaymentStatus(
      orderId,
      {
        maxAttempts: fromReturn ? 5 : 10,
        intervalMs: fromReturn ? 4000 : 8000,
        onPaid: () => {
          toast.success("Payment confirmed.");
          router.refresh();
        },
        onRefunded: () => {
          toast.error("Payment could not be completed and was refunded.");
          router.refresh();
        },
        onTimeout: () => {
          if (fromReturn) {
            toast.message(
              "Payment is still processing. This page will update when it clears.",
            );
            router.refresh();
          }
        },
      },
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [orderId, paymentStatus, router, searchParams]);

  if (paymentStatus === "PAID" || paymentStatus === "NONE") {
    return null;
  }

  if (paymentStatus === "REFUNDED") {
    return (
      <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Payment was refunded for this order.
      </div>
    );
  }

  async function handlePay() {
    setPaying(true);
    try {
      const res = await initiateOrderPayment(
        orderId,
        buildStandardCheckoutPayload(buildPaymentReturnUrl(orderId)),
      );
      const start = startPaymentCheckout(res.data);

      if (start.type === "redirect") {
        applyPaymentCheckoutStart(start);
        return;
      }

      toast.error("Could not start checkout. Try again.");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? paymentErrorMessage(err.message)
          : "Could not start payment.",
      );
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-4">
      <div>
        <p className="font-medium">Payment required</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete payment of{" "}
          <span className="font-medium text-foreground">
            {formatPrice(totalAmount, currency)}
          </span>{" "}
          to confirm this order. You will choose your payment method on the
          secure Flutterwave checkout page.
        </p>
      </div>
      <Button type="button" disabled={paying} onClick={handlePay}>
        {paying ? "Starting checkout…" : "Pay now"}
      </Button>
    </div>
  );
}
