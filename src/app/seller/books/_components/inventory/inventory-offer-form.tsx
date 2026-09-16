"use client";

import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { sellerInventoryKeys } from "@/lib/api/query-keys";
import {
  updateSellerInventory,
  type SellerInventoryListItem,
} from "@/app/seller/lib/api/inventory";

type Props = {
  offer: SellerInventoryListItem;
  onSuccess?: () => void;
};

export function InventoryOfferForm({ offer, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const form = useForm({
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="offer-price">Price</Label>
          <Input id="offer-price" {...form.register("price")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-stock">Stock</Label>
          <Input id="offer-stock" type="number" min={0} {...form.register("stock")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-condition">Condition</Label>
          <Input id="offer-condition" {...form.register("condition")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-signed">Signed</Label>
          <select
            id="offer-signed"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            {...form.register("signed")}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="offer-description">Notes</Label>
        <Textarea id="offer-description" rows={3} {...form.register("description")} />
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        Save offer
      </Button>
    </form>
  );
}
