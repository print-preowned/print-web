"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  createOrder,
  createOrderItem,
  formatPrice,
} from "@customer/api";
import { clearCart, useCart } from "@customer/cart";

function makeReference() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PRT-${Date.now()}-${rand}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, ready, total } = useCart();
  const [submitting, setSubmitting] = useState(false);

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
                  disabled={submitting}
                  onClick={async () => {
                    if (lines.length === 0) return;
                    setSubmitting(true);
                    let orderId: string | null = null;
                    try {
                      const created = await createOrder({
                        reference: makeReference(),
                        total_amount: Number(total.toFixed(2)),
                      });
                      orderId = created.data.id;
                      for (const line of lines) {
                        await createOrderItem(orderId, {
                          variant_id: line.variantId,
                          quantity: line.quantity,
                          unit_price: line.unitPrice,
                        });
                      }
                      clearCart();
                      router.push(`/orders/${orderId}`);
                    } catch (err) {
                      if (orderId) {
                        toast.error(
                          `Order created but some items failed. Reference order ${orderId}.`,
                        );
                        router.push(`/orders/${orderId}`);
                        return;
                      }
                      toast.error(
                        err instanceof ApiError
                          ? err.message
                          : "Could not place order.",
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? "Placing order…" : "Place order"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
