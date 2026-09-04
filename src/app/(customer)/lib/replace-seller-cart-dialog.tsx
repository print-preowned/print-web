"use client";

import Link from "next/link";
import { ArrowDown, ShoppingCart } from "lucide-react";
import { formatPrice } from "@customer/api";
import {
  cartItemCount,
  readCart,
  type CartLine,
} from "@customer/cart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartSellerName: string | null;
  pendingItem: CartLine | null;
  onConfirm: () => void;
};

function formatItemCount(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
}

export function ReplaceSellerCartDialog({
  open,
  onOpenChange,
  cartSellerName,
  pendingItem,
  onConfirm,
}: Props) {
  if (!pendingItem) return null;

  const cartCount = cartItemCount(readCart());
  const currentSeller = cartSellerName ?? "Another store";
  const nextSeller = pendingItem.sellerName ?? "This store";
  const configLabel =
    pendingItem.configLabel && pendingItem.configLabel !== "—"
      ? pendingItem.configLabel
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <div className="space-y-6 px-6 pb-2 pt-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-display text-xl tracking-tight">
              Your cart is from another store
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Checkout is limited to one store at a time. To add this item, your
              current cart will be replaced.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <section
              aria-label="Current cart"
              className="border border-border/80 bg-muted/30 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                In your cart
              </p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold leading-snug">
                    {currentSeller}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatItemCount(cartCount)}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Link href="/cart">
                    <ShoppingCart className="mr-2 size-4" aria-hidden />
                    Review cart
                  </Link>
                </Button>
              </div>
            </section>

            <div
              className="flex justify-center text-muted-foreground"
              aria-hidden
            >
              <ArrowDown className="size-4" />
            </div>

            <section
              aria-label="Item to add"
              className="border border-primary/25 bg-muted/20 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Adding instead
              </p>
              <div className="mt-3 flex gap-3">
                <div className="h-20 w-14 shrink-0 overflow-hidden bg-muted">
                  {pendingItem.image ? (
                    <img
                      src={pendingItem.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold leading-snug">
                    {pendingItem.bookTitle}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[configLabel, formatPrice(pendingItem.unitPrice)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {nextSeller}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/70 px-6 py-4 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Keep current cart
          </Button>
          <Button type="button" onClick={onConfirm}>
            Replace cart and add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
