"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import { AddressFields } from "@/components/address/address-fields";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  createUserAddress,
  formatAddressLine,
  readUserAddresses,
  type UserAddress,
  type UserAddressCreatePayload,
} from "@/lib/api/address";
import type { HttpMethod } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import {
  userAddressFormSchema,
  type UserAddressFormValues,
} from "@/lib/address/nigeria";

type PaginatedUserAddresses = {
  data: UserAddress[];
};

type CheckoutAddressPickerProps = {
  selectedId: string | null;
  onSelectedIdChange: (id: string | null) => void;
};

function emptyFormValues(): UserAddressFormValues {
  return {
    label: "",
    recipient_name: "",
    phone_number: "",
    line1: "",
    line2: "",
    city: "",
    state: "Lagos",
    postal_code: "",
  };
}

function toPayload(values: UserAddressFormValues): UserAddressCreatePayload {
  return {
    label: values.label || null,
    recipient_name: values.recipient_name,
    phone_number: values.phone_number,
    line1: values.line1,
    line2: values.line2 || null,
    city: values.city,
    state: values.state,
    postal_code: values.postal_code || null,
    country_code: "NG",
    is_default: true,
  };
}

function AddressOption({
  address,
  selected,
  onSelect,
}: {
  address: UserAddress;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border/70 hover:border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {address.label || address.recipient_name}
        </span>
        {address.is_default ? <Badge variant="secondary">Default</Badge> : null}
      </div>
      {address.label ? (
        <p className="mt-1 text-sm text-muted-foreground">{address.recipient_name}</p>
      ) : null}
      <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{formatAddressLine(address)}</span>
      </p>
      {address.phone_number ? (
        <p className="mt-1 flex gap-2 text-sm text-muted-foreground">
          <Phone className="size-4 shrink-0" aria-hidden />
          <span>{address.phone_number}</span>
        </p>
      ) : null}
    </button>
  );
}

function InlineAddressForm({
  onCreated,
  onCancel,
}: {
  onCreated: (address: UserAddress) => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const listKey = [readUserAddresses()];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserAddressFormValues>({
    resolver: zodResolver(userAddressFormSchema),
    defaultValues: emptyFormValues(),
  });

  const mutation = useMutation({
    mutationFn: async (values: UserAddressFormValues) => {
      const { endpoint, method, body } = createUserAddress(toPayload(values));
      return apiFetch<{ data: UserAddress }>(endpoint, {
        method: method as HttpMethod,
        body,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: listKey });
      toast.success("Address saved");
      onCreated(response.data);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not save address");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add delivery address</CardTitle>
        <CardDescription>
          Save an address to ship your order to.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="checkout-label">Label (optional)</Label>
            <Input id="checkout-label" {...register("label")} placeholder="Home, Office" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-recipient_name">Recipient name</Label>
            <Input
              id="checkout-recipient_name"
              {...register("recipient_name")}
              placeholder="Full name"
              className={errors.recipient_name ? "border-destructive" : ""}
            />
            {errors.recipient_name ? (
              <p className="text-sm text-destructive">{errors.recipient_name.message}</p>
            ) : null}
          </div>

          <AddressFields
            register={register}
            errors={errors}
            stateValue={watch("state")}
            onStateChange={(value) =>
              setValue("state", value as UserAddressFormValues["state"], {
                shouldValidate: true,
              })
            }
            phoneHelpText="Delivery phone for couriers."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save and use"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CheckoutAddressPicker({
  selectedId,
  onSelectedIdChange,
}: CheckoutAddressPickerProps) {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useApiQuery<PaginatedUserAddresses>(
    [readUserAddresses()],
    readUserAddresses(),
  );
  const addresses = data?.data ?? [];

  useEffect(() => {
    if (addresses.length === 0 || selectedId) return;
    const defaultAddress =
      addresses.find((address) => address.is_default) ?? addresses[0];
    onSelectedIdChange(defaultAddress.id);
  }, [addresses, onSelectedIdChange, selectedId]);

  useEffect(() => {
    if (addresses.length === 0 && !showForm) {
      setShowForm(true);
    }
  }, [addresses.length, showForm]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Could not load saved addresses. Try again or add a new address below.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Delivery address
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose where this order should be delivered.
          </p>
        </div>
        {addresses.length > 0 && !showForm ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add new
          </Button>
        ) : null}
      </div>

      {addresses.length > 0 && !showForm ? (
        <div className="grid gap-3">
          {addresses.map((address) => (
            <AddressOption
              key={address.id}
              address={address}
              selected={selectedId === address.id}
              onSelect={() => onSelectedIdChange(address.id)}
            />
          ))}
        </div>
      ) : null}

      {showForm ? (
        <InlineAddressForm
          onCancel={() => {
            if (addresses.length > 0) {
              setShowForm(false);
            }
          }}
          onCreated={(address) => {
            onSelectedIdChange(address.id);
            setShowForm(false);
          }}
        />
      ) : null}
    </section>
  );
}
