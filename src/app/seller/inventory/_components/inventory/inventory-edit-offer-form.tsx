"use client";

import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { sellerInventoryKeys } from "@/lib/api/query-keys";
import {
  updateSellerInventory,
  type SellerInventory,
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
      price: String(offer.price),
      stock: String(offer.stock),
      condition: offer.condition ?? "",
      signed: offer.signed ? "true" : "false",
      description: offer.description ?? "",
    },
  });

  const mutation = useApiMutation({
    onSuccess: () => {
      toast.success("Offer updated");
      void queryClient.invalidateQueries({ queryKey: sellerInventoryKeys.all });
      onSuccess?.();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update offer"),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        mutation.mutate(
          updateSellerInventory(offer.id, {
            price: values.price,
            stock: Number(values.stock),
            condition: values.condition.trim() || null,
            signed: values.signed === "true",
            description: values.description.trim() || null,
          }),
        );
      })}
    >
      <InventoryOfferFields
        idPrefix="offer"
        register={form.register}
        conditionValue={form.watch("condition")}
        isPending={mutation.isPending}
        submitLabel="Save offer"
      />
    </form>
  );
}
