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
import { readPublishersListUrl, type Publisher } from "@/lib/api/publisher";
import { createSeries, updateSeries, type Series } from "@/lib/api/series";
import { PaginatedResponse } from "@/lib/api/user";
import { toast } from "sonner";

type SeriesFormProps = {
  series?: Series;
  onSuccess?: () => void;
};

type SeriesFormValues = {
  title: string;
  issn: string;
  status: string;
};

export function AdminSeriesForm({ series, onSuccess }: SeriesFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!series;
  const [publisherId, setPublisherId] = useState<string | null>(series?.publisherId ?? null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SeriesFormValues>({
    defaultValues: {
      title: series?.title ?? "",
      issn: series?.issn ?? "",
      status: series?.status ?? "ACTIVE",
    },
  });

  const { data: publishersData } = useQuery<PaginatedResponse<Publisher>>({
    queryKey: ["publishers", { page: 1, size: 100 }],
    queryFn: () => apiFetch(readPublishersListUrl({ page: 1, size: 100 })),
  });

  const publisherOptions = useMemo(
    () =>
      mergeAutocompleteOptions(
        (publishersData?.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        series?.publisherId && series.publisherName
          ? [{ value: series.publisherId, label: series.publisherName }]
          : [],
      ),
    [publishersData?.data, series],
  );

  const createMutation = useMutation({
    mutationFn: async (data: SeriesFormValues) => {
      const request = createSeries({
        title: data.title.trim(),
        issn: data.issn.trim() || null,
        publisher_id: publisherId,
        status: data.status,
      });
      return apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      toast.success("Series created");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create series");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SeriesFormValues) => {
      const request = updateSeries(series!.id, {
        title: data.title.trim(),
        issn: data.issn.trim() || null,
        publisher_id: publisherId,
        status: data.status,
      });
      return apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      toast.success("Series updated");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update series");
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useDrawerFooter({
    formId: "admin-series-form",
    submitLabel: isEditing ? "Update series" : "Create series",
    loadingLabel: isEditing ? "Updating..." : "Creating...",
    isLoading,
  });

  return (
    <form
      id="admin-series-form"
      onSubmit={handleSubmit((data) => {
        if (isEditing) updateMutation.mutate(data);
        else createMutation.mutate(data);
      })}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <Label htmlFor="series-title">Title</Label>
        <Input
          id="series-title"
          {...register("title", { required: "Title is required" })}
        />
        {errors.title ? (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="series-issn">ISSN</Label>
        <Input id="series-issn" {...register("issn")} placeholder="0028-0836" />
      </div>

      <AutocompleteSelect
        id="series-publisher"
        label="Publisher"
        placeholder="Search publishers..."
        options={publisherOptions}
        value={publisherId}
        onValueChange={setPublisherId}
        showClear
        noResultsMessage="No publishers match your search"
      />

      <div className="flex flex-col gap-3">
        <Label htmlFor="series-status">Status</Label>
        <Select value={watch("status")} onValueChange={(value) => setValue("status", value)}>
          <SelectTrigger id="series-status">
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
