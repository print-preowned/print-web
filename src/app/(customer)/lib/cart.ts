"use client";

import { useEffect, useState } from "react";

export type CartLine = {
  variantId: string;
  quantity: number;
  unitPrice: number;
  bookTitle: string;
  image?: string | null;
  businessName?: string | null;
  configLabel?: string | null;
};

const CART_STORAGE_KEY = "print.cart.v1";
const CART_EVENT = "print:cart-updated";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_EVENT));
}

export function readCart(): CartLine[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) =>
        line &&
        typeof line.variantId === "string" &&
        typeof line.quantity === "number" &&
        line.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  notify();
}

export function cartItemCount(lines: CartLine[] = readCart()): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartTotal(lines: CartLine[] = readCart()): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

export function addToCart(
  input: Omit<CartLine, "quantity"> & { quantity?: number },
): void {
  const lines = readCart();
  const quantity = Math.max(1, input.quantity ?? 1);
  const existing = lines.find((line) => line.variantId === input.variantId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push({
      variantId: input.variantId,
      quantity,
      unitPrice: input.unitPrice,
      bookTitle: input.bookTitle,
      image: input.image ?? null,
      businessName: input.businessName ?? null,
      configLabel: input.configLabel ?? null,
    });
  }
  writeCart(lines);
}

export function setCartLineQuantity(variantId: string, quantity: number) {
  const lines = readCart();
  const next =
    quantity <= 0
      ? lines.filter((line) => line.variantId !== variantId)
      : lines.map((line) =>
          line.variantId === variantId ? { ...line, quantity } : line,
        );
  writeCart(next);
}

export function removeFromCart(variantId: string) {
  writeCart(readCart().filter((line) => line.variantId !== variantId));
}

export function clearCart() {
  writeCart([]);
}

function subscribeCart(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(CART_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CART_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    setReady(true);
    return subscribeCart(sync);
  }, []);

  return {
    lines,
    ready,
    count: cartItemCount(lines),
    total: cartTotal(lines),
    clearCart,
  };
}
