"use client"

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGenre, updateGenre, Genre } from "@/lib/api/genre";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";

type GenreFormProps = {
  genre?: Genre;
  onSuccess?: () => void;
};

export function AdminGenreForm({ genre, onSuccess }: GenreFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!genre;

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: genre || {
      name: "",
      description: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (genre) {
      setValue("name", genre.name);
      setValue("description", genre.description || "");
      setValue("status", genre.status);
    }
  }, [genre, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const request = await createGenre({
        name: data.name,
        description: data.description || null,
        status: data.status,
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
    onError: (error: any) => {
      toast.error(error.message || "Failed to create genre");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const request = await updateGenre(genre!.id, {
        name: data.name,
        description: data.description || null,
        status: data.status,
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
    onError: (error: any) => {
      toast.error(error.message || "Failed to update genre");
    },
  });

  const onSubmit = async (data: any) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

      <div className="flex flex-col gap-3">
        <Label htmlFor="status">Status</Label>
        <Select
          value={watch("status") || genre?.status || "ACTIVE"}
          onValueChange={(value) => setValue("status", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DrawerFooter className="pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Update Genre"
            : "Create Genre"}
        </Button>
        <DrawerClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </form>
  );
}
