"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format-price";
import {
  buildPaymentReturnUrl,
  pollOrderPaymentStatus,
  redirectToPaymentCheckout,
} from "@/lib/payment-checkout";
import {
  initiateOrderPayment,
  type OrderPaymentStatus,
  type VirtualAccountCheckoutDetails,
} from "@customer/api";

type Props = {
  orderId: string;
  paymentStatus: OrderPaymentStatus;
  totalAmount: number;
  currency: string;
};

function VirtualAccountPanel({
  details,
  currency,
}: {
  details: VirtualAccountCheckoutDetails;
  currency: string;
}) {
  const expires = new Date(details.expiry_datetime).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-4 text-sm">
      <p className="font-medium">Pay by bank transfer</p>
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Bank</dt>
          <dd className="font-medium">{details.bank_name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Account number</dt>
          <dd className="font-mono font-medium">{details.account_number}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium">
            {formatPrice(Number(details.amount), currency)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="font-mono text-xs">{details.reference}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Expires</dt>
          <dd>{expires}</dd>
        </div>
      </dl>
      <p className="text-muted-foreground">
        Transfer the exact amount using this reference. We will confirm your order
        automatically once payment is received.
      </p>
    </div>
  );
}

export function OrderPaymentPanel({
  orderId,
  paymentStatus,
  totalAmount,
  currency,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paying, setPaying] = useState(false);
  const [virtualAccount, setVirtualAccount] =
    useState<VirtualAccountCheckoutDetails | null>(null);
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
        maxAttempts: fromReturn ? 15 : 30,
        intervalMs: fromReturn ? 2000 : 4000,
        onPaid: () => {
          toast.success("Payment confirmed. Your order is placed.");
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
      const res = await initiateOrderPayment(orderId, {
        redirect_url: buildPaymentReturnUrl(orderId),
        checkout_type: "CHARGE",
        payment_method_type: "opay",
      });
      if (redirectToPaymentCheckout(res.data)) {
        return;
      }
      if (res.data.virtual_account) {
        setVirtualAccount(res.data.virtual_account);
        toast.success("Bank transfer details are ready below.");
        return;
      }
      toast.error("Could not start checkout. Try again.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not start payment.",
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
          to confirm this order. The seller is notified after payment succeeds.
        </p>
      </div>
      {virtualAccount ? (
        <VirtualAccountPanel details={virtualAccount} currency={currency} />
      ) : null}
      <Button type="button" disabled={paying} onClick={handlePay}>
        {paying ? "Starting checkout…" : "Pay now"}
      </Button>
    </div>
  );
}
