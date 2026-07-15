"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
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
import { addToCart } from "@customer/cart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  bookId: string;
  offers: PublicCatalogBusinessBook[];
};

type ListingResponse = { data?: PublicCatalogBusinessBookDetail };

function OfferAddToCart({
  sellerName,
  variants,
}: {
  sellerName: string;
  variants: PublicCatalogVariant[];
}) {
  const available = variants.filter((v) => v.stock > 0);
  const [selectedId, setSelectedId] = useState(available[0]?.id ?? "");

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No purchase options from this seller right now.
      </p>
    );
  }

  const selected = available.find((v) => v.id === selectedId) ?? available[0];

  function onAdd() {
    if (!selected) return;
    addToCart({
      variantId: selected.id,
      unitPrice: selected.price,
      bookTitle: selected.book_title,
      image: selected.book_image ?? selected.image,
      businessName: selected.business_name,
      configLabel: formatVariantConfig(selected.config),
      quantity: 1,
    });
    toast.success("Added to cart");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Sold by
        </p>
        <p className="font-display mt-1 text-2xl font-bold tracking-tight">
          {sellerName}
        </p>
      </div>

      {available.length > 1 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Choose format</legend>
          <ul className="space-y-2">
            {available.map((variant) => {
              const label = formatVariantConfig(variant.config);
              return (
                <li key={variant.id}>
                  <label className="flex cursor-pointer items-start gap-3 border border-border px-3 py-2.5 has-[:checked]:border-primary has-[:checked]:bg-muted/40">
                    <input
                      type="radio"
                      name="variant"
                      value={variant.id}
                      checked={selected?.id === variant.id}
                      onChange={() => setSelectedId(variant.id)}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {label === "—" ? "Standard listing" : label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatPrice(variant.price)} · {variant.stock} in stock
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
          <span className="font-medium">{formatPrice(selected?.price ?? 0)}</span>
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
      router.replace(qs ? `/books/${bookId}?${qs}` : `/books/${bookId}`, {
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

  const cover = listing?.image ?? listing?.book_image;

  return (
    <>
      <section className="storefront-rule mt-14 pt-10">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Offers marketplace
        </h2>
        {offers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No sellers are listing this title right now.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              {offers.length} {offers.length === 1 ? "seller" : "sellers"}{" "}
              available
            </p>
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {offers.map((offer) => (
                <li
                  key={offer.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-display text-lg font-semibold">
                      {offer.business_name}
                    </p>
                    {offer.synopsis ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {offer.synopsis}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {offer.variant_count}{" "}
                      {offer.variant_count === 1 ? "option" : "options"}{" "}
                      available
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    {offer.min_price != null ? (
                      <p className="font-display text-xl font-bold">
                        {formatPrice(offer.min_price)}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setListing(offer.id)}
                    >
                      View offer
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <Dialog
        open={Boolean(selectedListingId)}
        onOpenChange={(open) => {
          if (!open) setListing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          {isLoading || !listing ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading offer…" : "Offer not found."}
            </p>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-left text-2xl font-bold">
                  {listing.business_name}
                </DialogTitle>
                <DialogDescription className="text-left">
                  Offer details for this listing
                </DialogDescription>
              </DialogHeader>

              {cover ? (
                <div className="mt-4 aspect-[2/3] max-w-[160px] overflow-hidden border border-border bg-muted">
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              {listing.synopsis ? (
                <div className="mt-6">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    About this listing
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {listing.synopsis}
                  </p>
                </div>
              ) : null}

              <div className="storefront-rule mt-8 pt-6">
                <OfferAddToCart
                  sellerName={listing.business_name}
                  variants={listing.variants}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
