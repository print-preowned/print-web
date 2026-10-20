"use client"

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AutocompleteSelect, mergeAutocompleteOptions } from "@/components/autocomplete";
import { createGenre, readGenresListUrl, updateGenre, Genre } from "@/lib/api/genre";
import { PaginatedResponse } from "@/lib/api/user";
import { apiFetch, apiErrorToast } from "@/lib/api";
import { toast } from "sonner";
import { useDrawerFooter } from "@/components/form-drawer";

type GenreFormProps = {
  genre?: Genre;
  onSuccess?: () => void;
};

type GenreFormValues = {
  name: string;
  description: string;
};

export function AdminGenreForm({ genre, onSuccess }: GenreFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!genre;
  const [parentId, setParentId] = useState<string | null>(genre?.parentId ?? null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<GenreFormValues>({
    defaultValues: {
      name: genre?.name ?? "",
      description: genre?.description ?? "",
    },
  });

  const { data: genresData } = useQuery<PaginatedResponse<Genre>>({
    queryKey: ["genres", { page: 1, size: 100 }],
    queryFn: () => apiFetch(readGenresListUrl({ page: 1, size: 100 })),
  });
  const parentOptions = useMemo(
    () =>
      mergeAutocompleteOptions(
        (genresData?.data ?? [])
          .filter((row) => row.id !== genre?.id)
          .map((row) => ({ value: row.id, label: row.name })),
        genre?.parentId && genre.parentName
          ? [{ value: genre.parentId, label: genre.parentName }]
          : [],
      ),
    [genre, genresData?.data],
  );

  useEffect(() => {
    if (genre) {
      setValue("name", genre.name);
      setValue("description", genre.description || "");
    }
  }, [genre, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: GenreFormValues) => {
      const request = await createGenre({
        name: data.name,
        description: data.description || null,
        parent_id: parentId,
      });
      return apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      toast.success("Genre created successfully!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      apiErrorToast(error, "Failed to create genre");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: GenreFormValues) => {
      const request = await updateGenre(genre!.id, {
        name: data.name,
        description: data.description || null,
        parent_id: parentId,
      });
      return apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      queryClient.invalidateQueries({ queryKey: ["genre", genre!.id] });
      toast.success("Genre updated successfully!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      apiErrorToast(error, "Failed to update genre");
    },
  });

  const onSubmit = async (data: GenreFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useDrawerFooter({
    formId: "admin-genre-form",
    submitLabel: isEditing ? "Update Genre" : "Create Genre",
    loadingLabel: isEditing ? "Updating..." : "Creating...",
    isLoading,
  });

  return (
    <form
      id="admin-genre-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          rows={4}
          {...register("description")}
          placeholder="Enter a description for this genre..."
        />
      </div>

      <AutocompleteSelect
        id="genre-parent"
        label="Parent genre"
        placeholder="Search genres..."
        options={parentOptions}
        value={parentId}
        onValueChange={setParentId}
        showClear
        noResultsMessage="No genres match your search"
      />
    </form>
  );
}
