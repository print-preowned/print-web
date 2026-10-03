"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, ExternalLink, Store } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatProductForm } from "@/lib/api/publication";
import { formatOfferConfig } from "@customer/api";
import {
  formatPrice,
  PublicOffer,
  PublicWorkOfferSummary,
  readSellerOffers,
  VariantKey,
  VariantsConfig,
  type PublicSellerOffer,
} from "@customer/api";
import { addToCart, type CartLine } from "@customer/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  workId: string;
  offers: PublicWorkOfferSummary[];
};

type SellerOfferResponse = { data?: PublicSellerOffer };

function OfferAddToCart({
  variants,
  onSelectedChange,
  offers,
}: {
  variants: VariantsConfig;
  onSelectedChange?: (offer: PublicOffer | null) => void;
  offers: PublicOffer[]
}) {
  const [selectedVariants, setSelectedVariants] = useState<{[key: string]: string}>({});
  const [quantity, setQuantity] = useState(1);

  const selected = useMemo(() => {
    if (Object.keys(variants).length === 0) {
      return offers[0] ?? null;
    }
    if (Object.keys(selectedVariants).length === Object.keys(variants).length) {
      const possibleIds = variants[Object.keys(selectedVariants)[0] as VariantKey]?.[Object.values(selectedVariants)[0]] || [];
      if (possibleIds?.length == 0) return null;

      let selectedId = null;
      for (const id of possibleIds) {
        let idOverlap = 0;
        let index = 0
        while (index < Object.keys(selectedVariants).length && variants[Object.keys(selectedVariants)[index] as VariantKey]?.[Object.values(selectedVariants)[index]]?.includes(id)) {
          idOverlap++;
          index++;
        }
        if (idOverlap === Object.keys(selectedVariants).length) {
          selectedId = id;
          break;
        }
      }      
      return offers.find((offer) => offer.id === selectedId);
    }
  }, [selectedVariants, variants, offers]);

  const maxQuantity = selected?.stock ?? 1;

  const handleSelectVariant = useCallback((key: string, value: string) => {
    let selected = selectedVariants;
    if (selected?.[key] === value) {
      delete selected[key];
    }
    selected = { ...selected, [key]: value };
    setSelectedVariants(selected);
  }, []);

  useEffect(() => {
    onSelectedChange?.(selected ?? null);
  }, [selected, onSelectedChange]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariants]);

  const quantityExceedsStock = quantity > maxQuantity;

  function buildCartItem(
    offer: PublicOffer,
    qty: number,
  ): CartLine {
    return {
      sellerInventoryId: offer.id ?? null,
      unitPrice: offer.price,
      title: offer.publication.title || offer.work.title || "",
      image: offer.image || offer.publication.image || offer.work.image,
      sellerId: offer.seller.id,
      sellerName: offer.seller.name,
      configLabel: formatOfferConfig(selectedVariants),
      quantity: qty,
    };
  }

  function onAdd() {
    if (!selected || quantityExceedsStock) return;
    addToCart(buildCartItem(selected, quantity));
    toast.success("Added to cart");
  }

  return (
    <div className="space-y-4">
      {Object.keys(variants).map((key) => {
        const values = variants[key as VariantKey];
        const label = key === "product_form" ? "Product form" : key.toUpperCase();
        return (
          <fieldset key={key}>
            <legend className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {label}
            </legend>

            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.keys(values!).map((value) => {
                const label = key === "product_form" ? formatProductForm(value) : value.toUpperCase();
                const checked = selectedVariants?.[key] === value;
                return (
                  <li key={value}>
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
                        value={value}
                        checked={checked}
                        onChange={() => handleSelectVariant(key, value)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {label === "—" ? "Standard" : label}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )})
      }

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label
            htmlFor={`offer-qty-${selected?.id ?? "variant"}`}
            className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground"
          >
            Quantity
          </label>
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <input
                id={`offer-qty-${selected?.id ?? "variant"}`}
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                aria-invalid={quantityExceedsStock}
                className={cn(
                  "h-9 w-16 border bg-background px-2 text-sm",
                  quantityExceedsStock ? "border-destructive" : "border-input",
                )}
              />
              {maxQuantity < 10 ? (
                <span className="text-sm text-muted-foreground">
                  {maxQuantity} in stock
                </span>
              ) : null}
            </div>
            {quantityExceedsStock ? (
              <p className="text-sm text-destructive">
                Only {maxQuantity} available. Reduce the quantity to continue.
              </p>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          onClick={onAdd}
          disabled={quantityExceedsStock || !selected}
          className="w-full sm:w-auto"
        >
          Add to cart
        </Button>
      </div>
    </div>
  );
}

type OfferAccordionItemProps = {
  offer: PublicWorkOfferSummary;
  expanded: boolean;
  onToggle: () => void;
  sellerOffer: PublicSellerOffer | null | undefined;
  isLoading: boolean;
};

function OfferAccordionItem({
  offer,
  expanded,
  onToggle,
  sellerOffer,
  isLoading,
}: OfferAccordionItemProps) {
  const panelId = `offer-panel-${offer.seller.id}`;
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!expanded) {
      setSelectedPrice(null);
    }
  }, [expanded]);

  const handleSelectedChange = useCallback(
    (selectedOffer: PublicOffer | null) => {
      setSelectedPrice(selectedOffer?.price ?? null);
    },
    [],
  );

  const displayPrice = selectedPrice ?? offer.minPrice;

  return (
    <li className="overflow-hidden border border-border bg-card">
      <button
        type="button"
        id={`offer-trigger-${offer.seller.id}`}
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
            <span className="font-display text-md font-semibold">
              {offer.seller.name}
            </span>
            <Link
              href={`/seller/${offer.seller.id}`}
              className="inline-flex shrink-0 rounded-sm text-accent transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
              aria-label={`Visit ${offer.seller.name} storefront`}
              title="Visit storefront"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </span>
          {/* {offer.synopsis ? (
            <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">
              {offer.synopsis}
            </span>
          ) : null} */}
          <span className="mt-1 block text-sm text-muted-foreground">
            {offer.offerCount}{" "}
            {offer.offerCount === 1 ? "offer" : "offers"}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3 self-center">
          {displayPrice != null ? (
            <span className="font-display text-lg font-bold">
              {formatPrice(displayPrice)}
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
          aria-labelledby={`offer-trigger-${offer.seller.id}`}
          className="border-t border-border px-4 pb-5 pt-4 sm:px-5"
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading offers…</p>
          ) : sellerOffer ? (
            <OfferAddToCart
              variants={sellerOffer.variants}
              onSelectedChange={handleSelectedChange}
              offers={sellerOffer.offers}
            />
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

export function Marketplace({ workId, offers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSellerId =
    searchParams.get("seller") ?? searchParams.get("listing");

    const setSelectedSeller = useCallback(
    (sellerId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("listing");
      if (sellerId) {
        params.set("seller", sellerId);
      } else {
        params.delete("seller");
      }
      const qs = params.toString();
      router.replace(qs ? `/books/${workId}?${qs}#buy` : `/books/${workId}#buy`, {
        scroll: false,
      });
    },
    [workId, router, searchParams],
  );

  const { data: sellerOffer, isLoading } = useQuery({
    queryKey: ["customer-offer", selectedSellerId],
    queryFn: async () => {
      if (!selectedSellerId) return null;
      const res = await apiFetch<SellerOfferResponse>(
        readSellerOffers(workId, selectedSellerId),
      );
      return res.data ?? null;
    },
    enabled: Boolean(selectedSellerId),
  });

  useEffect(() => {
    if (offers.length === 1 && !selectedSellerId) {
      setSelectedSeller(offers[0]!.seller.id);
    }
  }, [offers, selectedSellerId, setSelectedSeller]);

  const lowestPrice = offers.reduce<number | null>((min, offer) => {
    if (offer.minPrice == null) return min;
    return min == null ? offer.minPrice : Math.min(min, offer.minPrice);
  }, null);

  if (offers.length === 0) {
    return (
      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Where to buy
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          No sellers are offering this title yet. Check back soon or browse similar
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
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
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
            <span className="font-display text-xl font-bold text-foreground">
              {formatPrice(lowestPrice)}
            </span>
          </p>
        ) : null}
      </div>

      <ul className="mt-8 space-y-3">
        {offers.map((offer) => (
          <OfferAccordionItem
            key={offer.seller.id}
            offer={offer}
            expanded={selectedSellerId === offer.seller.id}
            onToggle={() =>
              setSelectedSeller(
                selectedSellerId === offer.seller.id ? null : offer.seller.id,
              )
            }
            sellerOffer={selectedSellerId === offer.seller.id ? sellerOffer : null}
            isLoading={selectedSellerId === offer.seller.id && isLoading}
          />
        ))}
      </ul>
    </section>
  );
}
