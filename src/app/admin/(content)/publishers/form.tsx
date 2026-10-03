"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AutocompleteSelect, mergeAutocompleteOptions } from "@/components/autocomplete";
import { useDrawerFooter } from "@/components/form-drawer";
import { apiFetch } from "@/lib/api";
import {
  createPublisher,
  readPublishersListUrl,
  updatePublisher,
  type Publisher,
} from "@/lib/api/publisher";
import { PaginatedResponse } from "@/lib/api/user";
import { toast } from "sonner";

type PublisherFormProps = {
  publisher?: Publisher;
  onSuccess?: () => void;
};

type PublisherFormValues = {
  name: string;
  countryCode: string;
  status: string;
};

export function AdminPublisherForm({ publisher, onSuccess }: PublisherFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!publisher;
  const [parentId, setParentId] = useState<string | null>(publisher?.parentId ?? null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PublisherFormValues>({
    defaultValues: {
      name: publisher?.name ?? "",
      countryCode: publisher?.countryCode ?? "",
      status: publisher?.status ?? "ACTIVE",
    },
  });

  const { data: publishersData } = useQuery<PaginatedResponse<Publisher>>({
    queryKey: ["publishers", { page: 1, size: 100 }],
    queryFn: () => apiFetch(readPublishersListUrl({ page: 1, size: 100 })),
  });

  const parentOptions = useMemo(
    () =>
      mergeAutocompleteOptions(
        (publishersData?.data ?? [])
          .filter((row) => row.id !== publisher?.id)
          .map((row) => ({ value: row.id, label: row.name })),
        publisher?.parentId && publisher.parentName
          ? [{ value: publisher.parentId, label: publisher.parentName }]
          : [],
      ),
    [publisher, publishersData?.data],
  );

  const createMutation = useMutation({
    mutationFn: async (data: PublisherFormValues) => {
      const request = createPublisher({
        name: data.name.trim(),
        parent_id: parentId,
        country_code: data.countryCode.trim() || null,
        status: data.status,
      });
      return apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
      toast.success("Publisher created");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create publisher");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PublisherFormValues) => {
      const request = updatePublisher(publisher!.id, {
        name: data.name.trim(),
        parent_id: parentId,
        country_code: data.countryCode.trim() || null,
        status: data.status,
      });
      return apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
      toast.success("Publisher updated");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update publisher");
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useDrawerFooter({
    formId: "admin-publisher-form",
    submitLabel: isEditing ? "Update publisher" : "Create publisher",
    loadingLabel: isEditing ? "Updating..." : "Creating...",
    isLoading,
  });

  return (
    <form
      id="admin-publisher-form"
      onSubmit={handleSubmit((data) => {
        if (isEditing) updateMutation.mutate(data);
        else createMutation.mutate(data);
      })}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <Label htmlFor="publisher-name">Name</Label>
        <Input
          id="publisher-name"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name ? (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        ) : null}
      </div>

      <AutocompleteSelect
        id="publisher-parent"
        label="Imprint of"
        placeholder="Search publishers..."
        options={parentOptions}
        value={parentId}
        onValueChange={setParentId}
        showClear
        noResultsMessage="No publishers match your search"
      />
      <p className="-mt-2 text-muted-foreground text-xs">
        Set this when the publisher is an imprint of another house.
      </p>

      <div className="flex flex-col gap-3">
        <Label htmlFor="publisher-country">Country</Label>
        <Input
          id="publisher-country"
          {...register("countryCode")}
          placeholder="NG"
          maxLength={2}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="publisher-status">Status</Label>
        <Select
          value={watch("status") || "ACTIVE"}
          onValueChange={(value) => setValue("status", value)}
        >
          <SelectTrigger id="publisher-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  );
}
