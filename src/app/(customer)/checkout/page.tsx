"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckoutAddressPicker } from "@/components/address/checkout-address-picker";
import {
  CheckoutPickupLocationDisplay,
  usePickupAvailable,
} from "@/components/address/checkout-pickup-location-display";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { paymentErrorMessage } from "@/lib/payment-errors";
import { createOrder, formatPrice, initiateOrderPayment } from "@customer/api";
import { clearCart, useCart } from "@customer/cart";
import {
  applyPaymentCheckoutStart,
  buildStandardCheckoutPayload,
  buildPaymentReturnUrl,
  startPaymentCheckout,
} from "@/lib/payment-checkout";

function makeReference() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PRT-${Date.now()}-${rand}`;
}

type FulfillmentType = "DELIVERY" | "PICKUP";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, ready, total } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("DELIVERY");
  const [shippingAddressId, setShippingAddressId] = useState<string | null>(null);
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null);

  const businessId = lines[0]?.businessId ?? null;
  const { available: pickupAvailable, isLoading: pickupLoading } =
    usePickupAvailable(businessId);

  const handlePickupLocationLoaded = useCallback((id: string | null) => {
    setPickupLocationId(id);
  }, []);

  const canPlaceOrder = useMemo(() => {
    if (fulfillmentType === "DELIVERY") {
      return Boolean(shippingAddressId);
    }
    return Boolean(pickupLocationId);
  }, [fulfillmentType, pickupLocationId, shippingAddressId]);

  return (
    <div className="storefront-grain min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Checkout
        </h1>
        <p className="mt-2 text-muted-foreground">
          Confirm your order details
        </p>

        <div className="mt-10">
          {!ready ? (
            <p className="py-16 text-center text-muted-foreground">Loading…</p>
          ) : lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Link
                href="/books"
                className="mt-4 inline-flex text-sm font-semibold underline-offset-4 hover:underline"
              >
                Browse books
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Fulfillment</legend>
                <div className="flex flex-wrap gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 has-[:checked]:border-primary has-[:checked]:bg-muted/40">
                    <input
                      type="radio"
                      name="fulfillment-type"
                      value="DELIVERY"
                      checked={fulfillmentType === "DELIVERY"}
                      onChange={() => setFulfillmentType("DELIVERY")}
                    />
                    <span className="text-sm font-medium">Delivery</span>
                  </label>
                  {pickupAvailable ? (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 has-[:checked]:border-primary has-[:checked]:bg-muted/40">
                      <input
                        type="radio"
                        name="fulfillment-type"
                        value="PICKUP"
                        checked={fulfillmentType === "PICKUP"}
                        onChange={() => setFulfillmentType("PICKUP")}
                      />
                      <span className="text-sm font-medium">Pickup</span>
                    </label>
                  ) : pickupLoading ? (
                    <p className="self-center text-sm text-muted-foreground">
                      Checking pickup options…
                    </p>
                  ) : null}
                </div>
              </fieldset>

              {fulfillmentType === "DELIVERY" ? (
                <CheckoutAddressPicker
                  selectedId={shippingAddressId}
                  onSelectedIdChange={setShippingAddressId}
                />
              ) : businessId ? (
                <CheckoutPickupLocationDisplay
                  businessId={businessId}
                  onLocationLoaded={handlePickupLocationLoaded}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pickup is unavailable for this cart.
                </p>
              )}

              <ul className="divide-y divide-border/70 border-y border-border/70">
                {lines.map((line) => (
                  <li
                    key={line.variantId}
                    className="flex justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="font-medium">{line.bookTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty {line.quantity}
                        {line.configLabel && line.configLabel !== "—"
                          ? ` · ${line.configLabel}`
                          : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg font-semibold">
                  Total <span className="font-display">{formatPrice(total)}</span>
                </p>
                <Button
                  type="button"
                  disabled={submitting || !canPlaceOrder}
                  onClick={async () => {
                    if (lines.length === 0 || !canPlaceOrder) return;
                    setSubmitting(true);
                    let orderId: string | null = null;
                    try {
                      const created = await createOrder({
                        reference: makeReference(),
                        total_amount: Number(total.toFixed(2)),
                        fulfillment_type: fulfillmentType,
                        ...(fulfillmentType === "DELIVERY"
                          ? { shipping_address_id: shippingAddressId! }
                          : { pickup_location_id: pickupLocationId! }),
                        items: lines.map((line) => ({
                          variant_id: line.variantId,
                          quantity: line.quantity,
                          unit_price: line.unitPrice,
                        })),
                      });
                      orderId = created.data.id;
                      clearCart();

                      const payment = await initiateOrderPayment(
                        orderId,
                        buildStandardCheckoutPayload(
                          buildPaymentReturnUrl(orderId),
                        ),
                      );
                      const start = startPaymentCheckout(payment.data);

                      if (start.type === "redirect") {
                        applyPaymentCheckoutStart(start);
                        return;
                      }

                      toast.error("Could not start checkout. Try again.");
                      router.push(`/orders/${orderId}`);
                    } catch (err) {
                      const message =
                        err instanceof ApiError
                          ? paymentErrorMessage(err.message)
                          : "Could not place order.";
                      if (orderId) {
                        toast.error(message);
                        router.push(`/orders/${orderId}`);
                      } else {
                        toast.error(message);
                      }
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? "Processing…" : "Proceed to payment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
