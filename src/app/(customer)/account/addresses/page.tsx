"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddressFields } from "@/components/address/address-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfirm } from "@/components/confirm-dialog-provider";
import {
  createUserAddress,
  deleteUserAddress,
  formatAddressLine,
  readUserAddresses,
  setDefaultUserAddress,
  updateUserAddress,
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
  pagination?: { total_results: number };
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

function toFormValues(address: UserAddress): UserAddressFormValues {
  return {
    label: address.label ?? "",
    recipient_name: address.recipient_name,
    phone_number: address.phone_number ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state as UserAddressFormValues["state"],
    postal_code: address.postal_code ?? "",
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
  };
}

function AddressListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <CardAction>
              <div className="flex gap-1">
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault,
}: {
  address: UserAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isSettingDefault: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">
            {address.label || address.recipient_name}
          </CardTitle>
          {address.is_default && <Badge variant="secondary">Default</Badge>}
        </div>
        {address.label ? (
          <CardDescription>{address.recipient_name}</CardDescription>
        ) : null}
        <CardAction>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={onEdit}
                >
                  <Pencil />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <p className="flex gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formatAddressLine(address)}</span>
        </p>
        {address.phone_number ? (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <Phone className="size-4 shrink-0" aria-hidden />
            <span>{address.phone_number}</span>
          </p>
        ) : null}
        {!address.is_default ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onSetDefault}
            disabled={isSettingDefault}
          >
            Set default
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AddressForm({
  editing,
  onCancel,
}: {
  editing: UserAddress | null;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const listKey = [readUserAddresses({ page: 1, size: 20 })];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserAddressFormValues>({
    resolver: zodResolver(userAddressFormSchema),
    defaultValues: editing ? toFormValues(editing) : emptyFormValues(),
  });

  useEffect(() => {
    reset(editing ? toFormValues(editing) : emptyFormValues());
  }, [editing, reset]);

  const mutation = useMutation({
    mutationFn: async (values: UserAddressFormValues) => {
      const payload = toPayload(values);
      if (editing) {
        const { endpoint, method, body } = updateUserAddress(editing.id, payload);
        return apiFetch(endpoint, { method: method as HttpMethod, body });
      }
      const { endpoint, method, body } = createUserAddress(payload);
      return apiFetch(endpoint, { method: method as HttpMethod, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      toast.success(editing ? "Address updated" : "Address added");
      onCancel();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save address");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "Edit address" : "Add address"}</CardTitle>
        <CardDescription>
          {editing
            ? "Update this saved delivery address."
            : "Save a delivery address for your orders."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input id="label" {...register("label")} placeholder="Home, Office" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_name">Recipient name</Label>
            <Input
              id="recipient_name"
              {...register("recipient_name")}
              placeholder="Full name"
              className={errors.recipient_name ? "border-destructive" : ""}
            />
            {errors.recipient_name && (
              <p className="text-sm text-destructive">{errors.recipient_name.message}</p>
            )}
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
              {mutation.isPending ? "Saving…" : editing ? "Save changes" : "Add address"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AddressesPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const listKey = [readUserAddresses({ page: 1, size: 20 })];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserAddress | null>(null);

  const { data, isLoading, error } = useApiQuery<PaginatedUserAddresses>(
    listKey,
    readUserAddresses({ page: 1, size: 20 }),
  );

  const addresses = data?.data ?? [];

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint, method } = setDefaultUserAddress(id);
      return apiFetch(endpoint, { method: method as HttpMethod });
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<PaginatedUserAddresses>(listKey);
      queryClient.setQueryData<PaginatedUserAddresses>(listKey, (current) => {
        if (!current?.data) return current;
        return {
          ...current,
          data: current.data.map((address) => ({
            ...address,
            is_default: address.id === id,
          })),
        };
      });
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      toast.error("Failed to update default address");
    },
    onSuccess: () => {
      toast.success("Default address updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint, method } = deleteUserAddress(id);
      return apiFetch(endpoint, { method: method as HttpMethod });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      toast.success("Address deleted");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (address: UserAddress) => {
    setEditing(address);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleDeleteAddress = async (address: UserAddress) => {
    const confirmed = await confirm({
      title: "Delete address?",
      description: "This address will be removed from your address book.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (confirmed) {
      deleteMutation.mutate(address.id);
    }
  };

  return (
    <div className="storefront-grain min-h-[70vh]">
      <div className="mx-auto flex max-w-6xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6 md:gap-6 md:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/account"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to account
            </Link>
            <p className="mt-2 text-muted-foreground">
              Manage saved delivery addresses for your orders.
            </p>
          </div>
          {!formOpen && (
            <Button onClick={openCreate}>Add address</Button>
          )}
        </div>

        {error && (
          <p className="text-destructive">Failed to load addresses. Please try again.</p>
        )}

        {isLoading ? (
          <AddressListSkeleton />
        ) : (
          <>
            {!error && addresses.length === 0 && !formOpen && (
              <Card>
                <CardHeader>
                  <CardTitle>No saved addresses yet</CardTitle>
                  <CardDescription>
                    Add a delivery address to use at checkout in a future update.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={openCreate}>Add your first address</Button>
                </CardContent>
              </Card>
            )}

            {addresses.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEdit={() => openEdit(address)}
                    onDelete={() => handleDeleteAddress(address)}
                    onSetDefault={() => setDefaultMutation.mutate(address.id)}
                    isSettingDefault={setDefaultMutation.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {formOpen && <AddressForm editing={editing} onCancel={closeForm} />}
      </div>
    </div>
  );
}
