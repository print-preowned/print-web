"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@customer/api";
import {
  removeFromCart,
  setCartLineQuantity,
  useCart,
} from "@customer/cart";

export default function CartPage() {
  const { lines, ready, total } = useCart();

  return (
    <div className="storefront-grain min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Cart
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review your selections before checkout
        </p>

        <div className="mt-10">
          {!ready ? (
            <p className="py-16 text-center text-muted-foreground">Loading cart…</p>
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
                    className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center"
                  >
                    <div className="h-28 w-20 shrink-0 overflow-hidden bg-muted">
                      {line.image ? (
                        <img
                          src={line.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold">
                        {line.bookTitle}
                      </p>
                      {line.configLabel && line.configLabel !== "—" ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {line.configLabel}
                        </p>
                      ) : null}
                      {line.sellerName ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {line.sellerName}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm font-medium">
                        {formatPrice(line.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="sr-only" htmlFor={`qty-${line.variantId}`}>
                        Quantity
                      </label>
                      <input
                        id={`qty-${line.variantId}`}
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          setCartLineQuantity(
                            line.variantId,
                            Math.max(1, Number(e.target.value) || 1),
                          )
                        }
                        className="h-9 w-16 border border-input bg-background px-2 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(line.variantId)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg font-semibold">
                  Total <span className="font-display">{formatPrice(total)}</span>
                </p>
                <Button asChild>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
