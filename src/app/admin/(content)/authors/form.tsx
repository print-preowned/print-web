"use client"

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { createAuthor, updateAuthor, Author } from "@/lib/api/author";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useDrawerFooter } from "@/components/form-drawer";

type AuthorFormProps = {
  author?: Author;
  onSuccess?: () => void;
};

export function AdminAuthorForm({ author, onSuccess }: AuthorFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!author;

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: author || {
      firstName: "",
      lastName: "",
      middleName: "",
      about: "",
      image: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (author) {
      setValue("firstName", author.firstName);
      setValue("lastName", author.lastName);
      setValue("middleName", author.middleName || "");
      setValue("about", author.about);
      setValue("image", author.image || "");
      setValue("status", author.status);
    }
  }, [author, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: Author) => {
      const request = createAuthor({
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        about: data.about,
        image: data.image || "",
        status: data.status,
      });
      return apiFetch<{ id: string }>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      toast.success("Author created successfully!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create author");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Author) => {
      const request = updateAuthor(author!.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        about: data.about,
        image: data.image || "",
        status: data.status,
      });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author", author!.id] });
      toast.success("Author updated successfully!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update author");
    },
  });

  const onSubmit = async (data: Author) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useDrawerFooter({
    formId: "admin-author-form",
    submitLabel: isEditing ? "Update Author" : "Create Author",
    loadingLabel: isEditing ? "Updating..." : "Creating...",
    isLoading,
  });

  return (
    <form
      id="admin-author-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="firstName">Firstname *</Label>
          <Input
            id="firstName"
            {...register("firstName", { required: "First name is required" })}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="lastName">Lastname *</Label>
          <Input
            id="lastName"
            {...register("lastName", { required: "Last name is required" })}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message as string}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="middleName">Middlename (Optional)</Label>
        <Input
          id="middleName"
          {...register("middleName")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          type="url"
          {...register("image")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="about">About *</Label>
        <Textarea
          id="about"
          rows={5}
          {...register("about", { required: "About is required" })}
        />
        {errors.about && (
          <p className="text-sm text-red-500">{errors.about.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="status">Status</Label>
        <Select
          value={watch("status") || author?.status || "ACTIVE"}
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
    </form>
  );
}
