"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog-provider";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HttpMethod } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import {
  deleteBusinessAddress,
  formatAddressLine,
  readBusinessAddresses,
  setPrimaryBusinessAddress,
  type BusinessAddress,
} from "@/lib/api/address";
import { usePrivilege } from "@/lib/auth/context";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { BusinessLocationForm } from "./business-location-form";

type PaginatedBusinessAddresses = {
  data: BusinessAddress[];
  pagination?: { total_results: number };
};

function LocationListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LocationCard({
  address,
  canManage,
  onEdit,
  onDelete,
  onSetPrimary,
  isSettingPrimary,
}: {
  address: BusinessAddress;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  isSettingPrimary: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">{address.label}</CardTitle>
          {address.is_primary && <Badge variant="secondary">Primary</Badge>}
        </div>
        {canManage && (
          <CardAction>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground"
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
                    className="size-6 text-destructive"
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
        )}
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
        {canManage && !address.is_primary ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onSetPrimary}
            disabled={isSettingPrimary}
          >
            Set primary
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function BusinessLocationsList() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const canRead = usePrivilege("READ_BUSINESS");
  const canManage = usePrivilege("UPDATE_BUSINESS");
  const listKey = [readBusinessAddresses({ page: 1, size: 20 })];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessAddress | null>(null);

  const { data, isLoading, error } = useApiQuery<PaginatedBusinessAddresses>(
    listKey,
    readBusinessAddresses({ page: 1, size: 20 }),
    { enabled: canRead },
  );

  const locations = data?.data ?? [];

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint, method } = setPrimaryBusinessAddress(id);
      return apiFetch(endpoint, { method: method as HttpMethod });
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<PaginatedBusinessAddresses>(listKey);
      queryClient.setQueryData<PaginatedBusinessAddresses>(listKey, (current) => {
        if (!current?.data) return current;
        return {
          ...current,
          data: current.data.map((location) => ({
            ...location,
            is_primary: location.id === id,
          })),
        };
      });
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      toast.error("Failed to update primary location");
    },
    onSuccess: () => {
      toast.success("Primary location updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { endpoint, method } = deleteBusinessAddress(id);
      return apiFetch(endpoint, { method: method as HttpMethod });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      toast.success("Location deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete location");
    },
  });

  if (!canRead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store locations</CardTitle>
          <CardDescription>
            You do not have permission to view store locations.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (location: BusinessAddress) => {
    setEditing(location);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleDeleteLocation = async (location: BusinessAddress) => {
    const confirmed = await confirm({
      title: "Delete location?",
      description: "This location will be removed from your business.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (confirmed) {
      deleteMutation.mutate(location.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Store locations</h2>
          <p className="text-sm text-muted-foreground">
            Physical addresses for your business. Pickup will use these in a future release.
          </p>
        </div>
        {canManage && !formOpen && (
          <Button onClick={openCreate}>Add location</Button>
        )}
      </div>

      {error && (
        <p className="text-destructive">Failed to load locations. Please try again.</p>
      )}

      {isLoading ? (
        <LocationListSkeleton />
      ) : (
        <>
          {!error && locations.length === 0 && !formOpen && (
            <Card>
              <CardHeader>
                <CardTitle>No store locations yet</CardTitle>
                <CardDescription>
                  {canManage
                    ? "Add a location where customers can pick up orders in a future release."
                    : "No locations have been added for this business yet."}
                </CardDescription>
              </CardHeader>
              {canManage && (
                <CardContent>
                  <Button onClick={openCreate}>Add your first location</Button>
                </CardContent>
              )}
            </Card>
          )}

          {locations.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {locations.map((location) => (
                <LocationCard
                  key={location.id}
                  address={location}
                  canManage={canManage}
                  onEdit={() => openEdit(location)}
                  onDelete={() => handleDeleteLocation(location)}
                  onSetPrimary={() => setPrimaryMutation.mutate(location.id)}
                  isSettingPrimary={setPrimaryMutation.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      {canManage && formOpen && (
        <BusinessLocationForm editing={editing} onCancel={closeForm} />
      )}
    </div>
  );
}
