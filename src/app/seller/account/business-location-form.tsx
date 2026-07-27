"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddressFields } from "@/components/address/address-fields";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HttpMethod } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import {
  createBusinessAddress,
  readBusinessAddresses,
  updateBusinessAddress,
  type BusinessAddress,
  type BusinessAddressCreatePayload,
} from "@/lib/api/address";
import {
  businessLocationFormSchema,
  type BusinessLocationFormValues,
} from "@/lib/address/nigeria";

function emptyFormValues(): BusinessLocationFormValues {
  return {
    label: "",
    phone_number: "",
    line1: "",
    line2: "",
    city: "",
    state: "Lagos",
    postal_code: "",
    pickup_enabled: false,
  };
}

function toFormValues(address: BusinessAddress): BusinessLocationFormValues {
  return {
    label: address.label,
    phone_number: address.phone_number ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state as BusinessLocationFormValues["state"],
    postal_code: address.postal_code ?? "",
    pickup_enabled: address.pickup_enabled,
  };
}

function toPayload(values: BusinessLocationFormValues): BusinessAddressCreatePayload {
  return {
    label: values.label,
    phone_number: values.phone_number || null,
    line1: values.line1,
    line2: values.line2 || null,
    city: values.city,
    state: values.state,
    postal_code: values.postal_code || null,
    country_code: "NG",
    pickup_enabled: values.pickup_enabled,
  };
}

export function BusinessLocationForm({
  editing,
  onCancel,
}: {
  editing: BusinessAddress | null;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const listKey = [readBusinessAddresses({ page: 1, size: 20 })];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessLocationFormValues>({
    resolver: zodResolver(businessLocationFormSchema),
    defaultValues: editing ? toFormValues(editing) : emptyFormValues(),
  });

  useEffect(() => {
    reset(editing ? toFormValues(editing) : emptyFormValues());
  }, [editing, reset]);

  const mutation = useMutation({
    mutationFn: async (values: BusinessLocationFormValues) => {
      const payload = toPayload(values);
      if (editing) {
        const { endpoint, method, body } = updateBusinessAddress(editing.id, payload);
        return apiFetch(endpoint, { method: method as HttpMethod, body });
      }
      const { endpoint, method, body } = createBusinessAddress(payload);
      return apiFetch(endpoint, { method: method as HttpMethod, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      toast.success(editing ? "Location updated" : "Location added");
      onCancel();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save location");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "Edit location" : "Add location"}</CardTitle>
        <CardDescription>
          {editing
            ? "Update this store or warehouse address."
            : "Add a physical location for your business."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="label">Location name</Label>
            <Input
              id="label"
              {...register("label")}
              placeholder="Main store, Warehouse"
              className={errors.label ? "border-destructive" : ""}
            />
            {errors.label && (
              <p className="text-sm text-destructive">{errors.label.message}</p>
            )}
          </div>

          <AddressFields
            register={register}
            errors={errors}
            stateValue={watch("state")}
            onStateChange={(value) =>
              setValue("state", value as BusinessLocationFormValues["state"], {
                shouldValidate: true,
              })
            }
            phoneRequired={false}
            phoneHelpText="Contact phone for this location."
          />

          <label className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-3">
            <input
              type="checkbox"
              className="mt-1"
              {...register("pickup_enabled")}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">
                Offer pickup at this location
              </span>
              <span className="block text-sm text-muted-foreground">
                Only one location per business can accept pickup orders.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : editing ? "Save changes" : "Add location"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
