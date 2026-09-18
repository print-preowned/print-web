"use client";

import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INVENTORY_CONDITIONS } from "@/app/seller/lib/inventory-condition";

export type InventoryOfferValues = {
  price: string;
  stock: string;
  condition: string;
  description: string;
  signed: "true" | "false";
};

type Props<T extends FieldValues> = {
  idPrefix: string;
  register: UseFormRegister<T>;
  conditionValue: string;
  errors?: FieldErrors<InventoryOfferValues>;
  namePrefix?: "offer";
  isPending?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
};

const inputClassName = "bg-background";

export function InventoryOfferFields<T extends FieldValues>({
  idPrefix,
  register,
  conditionValue,
  errors,
  namePrefix,
  isPending = false,
  submitDisabled = false,
  submitLabel = "Add inventory",
}: Props<T>) {
  const path = (name: keyof InventoryOfferValues) =>
    (namePrefix ? `${namePrefix}.${name}` : name) as Path<T>;
  const selectedCondition = INVENTORY_CONDITIONS.find(
    (condition) => condition.value === conditionValue,
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-price`}>Price</Label>
          <Input
            id={`${idPrefix}-price`}
            className={inputClassName + (errors?.price ? " border-destructive" : "")}
            inputMode="decimal"
            placeholder="0.00"
            {...register(path("price"))}
          />
          {errors?.price?.message ? (
            <p className="text-destructive text-sm">{String(errors.price.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-stock`}>Stock</Label>
          <Input
            id={`${idPrefix}-stock`}
            className={inputClassName + (errors?.stock ? " border-destructive" : "")}
            inputMode="numeric"
            {...register(path("stock"))}
          />
          {errors?.stock?.message ? (
            <p className="text-destructive text-sm">{String(errors.stock.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-signed`}>Signed</Label>
          <select
            id={`${idPrefix}-signed`}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            {...register(path("signed"))}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-condition`}>Condition</Label>
        <select
          id={`${idPrefix}-condition`}
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          {...register(path("condition"))}
        >
          <option value="">Select condition</option>
          {INVENTORY_CONDITIONS.map((condition) => (
            <option key={condition.value} value={condition.value}>
              {condition.value}
            </option>
          ))}
        </select>
        {selectedCondition ? (
          <p className="text-muted-foreground text-xs">{selectedCondition.description}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Choose the lowest matching tier. Extra notes belong in the description.
          </p>
        )}
        {errors?.condition?.message ? (
          <p className="text-destructive text-sm">{String(errors.condition.message)}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          rows={3}
          className={inputClassName}
          {...register(path("description"))}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || submitDisabled}>
          {isPending ? <LoaderCircle className="animate-spin" /> : submitLabel === "Add inventory" ? <Plus /> : null}
          {submitLabel}
        </Button>
      </div>
    </>
  );
}
