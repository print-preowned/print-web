"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, ExternalLink, Store } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatVariantConfig } from "@/lib/api/variant";
import {
  formatPrice,
  readPublicBusinessBookById,
  type PublicCatalogBusinessBook,
  type PublicCatalogBusinessBookDetail,
  type PublicCatalogVariant,
} from "@customer/api";
import { addToCart, replaceCartWithItem, type CartLine } from "@customer/cart";
import { ReplaceSellerCartDialog } from "@customer/replace-seller-cart-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  bookId: string;
  offers: PublicCatalogBusinessBook[];
};

type ListingResponse = { data?: PublicCatalogBusinessBookDetail };

type PendingCartItem = Omit<CartLine, "quantity"> & { quantity?: number };

function OfferAddToCart({
  variants,
}: {
  variants: PublicCatalogVariant[];
}) {
  const available = variants.filter((v) => v.stock > 0);
  const [selectedId, setSelectedId] = useState(available[0]?.id ?? "");
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<PendingCartItem | null>(null);
  const [cartBusinessName, setCartBusinessName] = useState<string | null>(null);

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No purchase options from this seller right now.
      </p>
    );
  }

  const selected = available.find((v) => v.id === selectedId) ?? available[0];

  function buildCartItem(variant: PublicCatalogVariant): PendingCartItem {
    return {
      variantId: variant.id,
      unitPrice: variant.price,
      bookTitle: variant.book_title,
      image: variant.book_image ?? variant.image,
      businessId: variant.business_id,
      businessName: variant.business_name,
      configLabel: formatVariantConfig(variant.config),
      quantity: 1,
    };
  }

  function onAdd() {
    if (!selected) return;
    const item = buildCartItem(selected);
    const result = addToCart(item);
    if (!result.ok) {
      setPendingItem(item);
      setCartBusinessName(result.cartBusinessName);
      setReplaceDialogOpen(true);
      return;
    }
    toast.success("Added to cart");
  }

  function onReplaceDialogOpenChange(open: boolean) {
    setReplaceDialogOpen(open);
    if (!open) {
      setPendingItem(null);
      setCartBusinessName(null);
    }
  }

  function onConfirmReplace() {
    if (!pendingItem) return;
    replaceCartWithItem(pendingItem);
    toast.success("Added to cart");
    onReplaceDialogOpenChange(false);
  }

  return (
    <>
    <div className="space-y-4">
      {available.length > 1 ? (
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Choose format
          </legend>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {available.map((variant) => {
              const label = formatVariantConfig(variant.config);
              const checked = selected?.id === variant.id;
              return (
                <li key={variant.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border px-3 py-3 transition-colors",
                      checked
                        ? "border-primary bg-muted/50"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="variant"
                      value={variant.id}
                      checked={checked}
                      onChange={() => setSelectedId(variant.id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {label === "—" ? "Standard listing" : label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatPrice(variant.price)}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : (
        <p className="text-sm">
          <span className="font-semibold">{formatPrice(selected?.price ?? 0)}</span>
          <span className="text-muted-foreground">
            {" "}
            · {selected?.stock} in stock
          </span>
        </p>
      )}

      <Button type="button" onClick={onAdd} className="w-full sm:w-auto">
        Add to cart
      </Button>
    </div>
    <ReplaceSellerCartDialog
      open={replaceDialogOpen}
      onOpenChange={onReplaceDialogOpenChange}
      cartBusinessName={cartBusinessName}
      pendingItem={pendingItem}
      onConfirm={onConfirmReplace}
    />
    </>
  );
}

type OfferAccordionItemProps = {
  offer: PublicCatalogBusinessBook;
  expanded: boolean;
  onToggle: () => void;
  listing: PublicCatalogBusinessBookDetail | null | undefined;
  isLoading: boolean;
};

function OfferAccordionItem({
  offer,
  expanded,
  onToggle,
  listing,
  isLoading,
}: OfferAccordionItemProps) {
  const panelId = `offer-panel-${offer.id}`;

  return (
    <li className="overflow-hidden border border-border bg-card">
      <button
        type="button"
        id={`offer-trigger-${offer.id}`}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        className="storefront-hover-surface flex w-full items-start gap-4 p-4 text-left sm:items-center sm:p-5"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-muted text-muted-foreground sm:mt-0">
          <Store className="h-4 w-4" aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold">
              {offer.business_name}
            </span>
            <Link
              href={`/stores/${offer.business_id}`}
              className="inline-flex shrink-0 rounded-sm text-accent transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
              aria-label={`Visit ${offer.business_name} store`}
              title="Visit store"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </span>
          {offer.synopsis ? (
            <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">
              {offer.synopsis}
            </span>
          ) : null}
          <span className="mt-1 block text-sm text-muted-foreground">
            {offer.variant_count}{" "}
            {offer.variant_count === 1 ? "option" : "options"}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3 self-center">
          {offer.min_price != null ? (
            <span className="font-display text-xl font-bold">
              {formatPrice(offer.min_price)}
            </span>
          ) : null}
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
        </span>
      </button>

      {expanded ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`offer-trigger-${offer.id}`}
          className="border-t border-border px-4 pb-5 pt-4 sm:px-5"
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading options…</p>
          ) : listing ? (
            <OfferAddToCart variants={listing.variants} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Could not load this offer. Try again.
            </p>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function Marketplace({ bookId, offers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedListingId = searchParams.get("listing");

  const setListing = useCallback(
    (listingId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (listingId) {
        params.set("listing", listingId);
      } else {
        params.delete("listing");
      }
      const qs = params.toString();
      router.replace(qs ? `/books/${bookId}?${qs}#buy` : `/books/${bookId}#buy`, {
        scroll: false,
      });
    },
    [bookId, router, searchParams],
  );

  const { data: listing, isLoading } = useQuery({
    queryKey: ["customer-offer", selectedListingId],
    queryFn: async () => {
      if (!selectedListingId) return null;
      const res = await apiFetch<ListingResponse>(
        readPublicBusinessBookById(selectedListingId),
      );
      return res.data ?? null;
    },
    enabled: Boolean(selectedListingId),
  });

  useEffect(() => {
    if (offers.length === 1 && !selectedListingId) {
      setListing(offers[0]!.id);
    }
  }, [offers, selectedListingId, setListing]);

  const lowestPrice = offers.reduce<number | null>((min, offer) => {
    if (offer.min_price == null) return min;
    return min == null ? offer.min_price : Math.min(min, offer.min_price);
  }, null);

  if (offers.length === 0) {
    return (
      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Where to buy
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          No sellers are listing this title yet. Check back soon or browse similar
          books in the catalog.
        </p>
      </section>
    );
  }

  return (
    <section id="buy" className="mt-14 scroll-mt-28 border-t border-border pt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Where to buy
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Choose a seller
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {offers.length} independent{" "}
            {offers.length === 1 ? "seller" : "sellers"} · compare price and
            format below
          </p>
        </div>
        {lowestPrice != null ? (
          <p className="text-sm text-muted-foreground">
            From{" "}
            <span className="font-display text-2xl font-bold text-foreground">
              {formatPrice(lowestPrice)}
            </span>
          </p>
        ) : null}
      </div>

      <ul className="mt-8 space-y-3">
        {offers.map((offer) => (
          <OfferAccordionItem
            key={offer.id}
            offer={offer}
            expanded={selectedListingId === offer.id}
            onToggle={() =>
              setListing(selectedListingId === offer.id ? null : offer.id)
            }
            listing={selectedListingId === offer.id ? listing : null}
            isLoading={selectedListingId === offer.id && isLoading}
          />
        ))}
      </ul>
    </section>
  );
}
