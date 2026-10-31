"use client";

import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { apiErrorToast } from "@/lib/api";
import { sellerInventoryKeys } from "@/lib/api/query-keys";
import { listingStatusDescription } from "@/lib/seller-book-listing-status";
import {
  describeMissing,
  updateSellerInventory,
  type SellerInventory,
  type SellerInventoryUpdatePayload,
} from "@/app/seller/lib/api/inventory";
import { InventoryOfferFields, type InventoryOfferValues } from "./inventory-offer-fields";

type Props = {
  offer: SellerInventory;
  onSuccess?: () => void;
};

export function InventoryEditOfferForm({ offer, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<InventoryOfferValues>({
    defaultValues: {
      price: offer.price != null ? String(offer.price) : "",
      stock: String(offer.stock),
      condition: offer.condition ?? "",
      signed: offer.signed ? "true" : "false",
      description: offer.description ?? "",
    },
  });

  const mutation = useApiMutation({
    onError: (error: Error) => apiErrorToast(error, "Failed to update offer"),
  });

  // Drafts and paused offers can be saved as they are, or saved and put live in one go.
  const canPublish = offer.status === "DRAFT" || offer.status === "INACTIVE";

  function save(values: InventoryOfferValues, publish: boolean) {
    const price = values.price.trim();
    const payload: SellerInventoryUpdatePayload = {
      ...(price ? { price } : {}),
      stock: Number(values.stock),
      ...(values.condition.trim() ? { condition: values.condition.trim() } : {}),
      signed: values.signed === "true",
      description: values.description.trim() || null,
      ...(publish ? { status: "ACTIVE" as const } : {}),
    };
    mutation.mutate(updateSellerInventory(offer.id, payload), {
      onSuccess: () => {
        toast.success(publish ? "Offer is live" : "Offer updated");
        void queryClient.invalidateQueries({ queryKey: sellerInventoryKeys.all });
        onSuccess?.();
      },
    });
  }

  const gaps = offer.status === "ACTIVE" ? offer.missing.filter((f) => f !== "stock") : offer.missing;

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => save(values, canPublish))}
    >
      {canPublish ? (
        <p className="text-muted-foreground text-sm">
          {listingStatusDescription(offer.status)}
          {gaps.length > 0 ? ` ${describeMissing(gaps)} before it can go live.` : ""}
        </p>
      ) : null}
      <InventoryOfferFields
        idPrefix="offer"
        register={form.register}
        conditionValue={form.watch("condition")}
        isPending={mutation.isPending}
        submitLabel={canPublish ? "Save and publish" : "Save offer"}
        secondaryAction={
          canPublish
            ? {
                label: offer.status === "DRAFT" ? "Save draft" : "Save",
                onClick: () => void form.handleSubmit((values) => save(values, false))(),
              }
            : undefined
        }
      />
    </form>
  );
}
