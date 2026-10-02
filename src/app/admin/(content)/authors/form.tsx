"use client"

import { useEffect, useState } from "react";
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
import { createAuthor, updateAuthor, Author, AuthorNameInput } from "@/lib/api/author";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useDrawerFooter } from "@/components/form-drawer";

type AuthorFormProps = {
  author?: Author;
  onSuccess?: () => void;
};

type AuthorFormValues = {
  kind: string;
  keyNames: string;
  namesBeforeKey: string;
  prefixToKey: string;
  namesAfterKey: string;
  namePrefix: string;
  nameSuffix: string;
  displayOverride: boolean;
  displayNameFlat: string;
  displayNameInverted: string;
  about: string;
  image: string;
  status: string;
};

function joinParts(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" ");
}

export function previewAuthorName(values: AuthorFormValues) {
  const flat = joinParts([
    values.namePrefix,
    values.namesBeforeKey,
    values.prefixToKey,
    values.keyNames,
    values.namesAfterKey,
    values.nameSuffix,
  ]);
  const precedes = joinParts([values.namesBeforeKey, values.prefixToKey]);
  const inverted = precedes
    ? `${values.keyNames.trim()}, ${joinParts([precedes, values.namesAfterKey, values.nameSuffix])}`
    : flat;
  if (values.displayOverride) {
    return {
      flat: values.displayNameFlat.trim() || flat,
      inverted: values.displayNameInverted.trim() || inverted,
    };
  }
  return { flat, inverted };
}

function toNameInput(values: AuthorFormValues): AuthorNameInput {
  const preview = previewAuthorName(values);
  return {
    keyNames: values.keyNames.trim(),
    namesBeforeKey: values.namesBeforeKey.trim() || null,
    prefixToKey: values.prefixToKey.trim() || null,
    namesAfterKey: values.namesAfterKey.trim() || null,
    namePrefix: values.namePrefix.trim() || null,
    nameSuffix: values.nameSuffix.trim() || null,
    displayOverride: values.displayOverride,
    displayNameFlat: values.displayOverride ? preview.flat : null,
    displayNameInverted: values.displayOverride ? preview.inverted : null,
  };
}

export function AdminAuthorForm({ author, onSuccess }: AuthorFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!author;
  const [showParts, setShowParts] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<AuthorFormValues>({
    defaultValues: {
      kind: author?.kind || "PERSON",
      keyNames: author?.name.keyNames || "",
      namesBeforeKey: author?.name.namesBeforeKey || "",
      prefixToKey: author?.name.prefixToKey || "",
      namesAfterKey: author?.name.namesAfterKey || "",
      namePrefix: author?.name.namePrefix || "",
      nameSuffix: author?.name.nameSuffix || "",
      displayOverride: author?.name.displayOverride || false,
      displayNameFlat: author?.name.displayNameFlat || "",
      displayNameInverted: author?.name.displayNameInverted || "",
      about: author?.about || "",
      image: author?.image || "",
      status: author?.status || "CANONICAL",
    },
  });

  useEffect(() => {
    if (!author) return;
    setValue("kind", author.kind);
    setValue("keyNames", author.name.keyNames);
    setValue("namesBeforeKey", author.name.namesBeforeKey || "");
    setValue("prefixToKey", author.name.prefixToKey || "");
    setValue("namesAfterKey", author.name.namesAfterKey || "");
    setValue("namePrefix", author.name.namePrefix || "");
    setValue("nameSuffix", author.name.nameSuffix || "");
    setValue("displayOverride", Boolean(author.name.displayOverride));
    setValue("displayNameFlat", author.name.displayNameFlat);
    setValue("displayNameInverted", author.name.displayNameInverted);
    setValue("about", author.about);
    setValue("image", author.image || "");
    setValue("status", author.status);
  }, [author, setValue]);

  const values = watch();
  const preview = previewAuthorName(values);

  const createMutation = useMutation({
    mutationFn: async (data: AuthorFormValues) => {
      const request = createAuthor({
        kind: data.kind,
        name: toNameInput(data),
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
    mutationFn: async (data: AuthorFormValues) => {
      const request = updateAuthor(author!.id, {
        kind: data.kind,
        name: toNameInput(data),
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

  const onSubmit = async (data: AuthorFormValues) => {
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
      <div className="flex flex-col gap-3">
        <Label htmlFor="keyNames">Key Name (filing form) *</Label>
        <Input
          id="keyNames"
          {...register("keyNames", { required: "Filing name is required" })}
        />
        {errors.keyNames && (
          <p className="text-sm text-red-500">{errors.keyNames.message}</p>
        )}
        {values.keyNames && <p className="text-sm text-muted-foreground">
          Shows as {preview.flat}. Files as {preview.inverted}.
        </p>}
      </div>

      <button
        type="button"
        className="self-start text-sm underline"
        onClick={() => setShowParts((open) => !open)}
      >
        {showParts ? "Hide name parts" : "More name parts"}
      </button>

      {showParts && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="namesBeforeKey">Names before key</Label>
            <Input id="namesBeforeKey" {...register("namesBeforeKey")} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="prefixToKey">Prefix to key</Label>
            <Input id="prefixToKey" {...register("prefixToKey")} />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="namesAfterKey">Names after key</Label>
            <Input id="namesAfterKey" {...register("namesAfterKey")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="namePrefix">Title</Label>
              <Input id="namePrefix" {...register("namePrefix")} />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="nameSuffix">Suffix</Label>
              <Input id="nameSuffix" {...register("nameSuffix")} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("displayOverride")} />
            Override display names
          </label>
          {values.displayOverride && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="displayNameFlat">Display name</Label>
                <Input id="displayNameFlat" {...register("displayNameFlat")} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="displayNameInverted">Filing display</Label>
                <Input id="displayNameInverted" {...register("displayNameInverted")} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" type="url" {...register("image")} />
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="about">About</Label>
        <Textarea
          id="about"
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="kind">Kind</Label>
          <Select value={values.kind} onValueChange={(value) => setValue("kind", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERSON">Person</SelectItem>
              <SelectItem value="ORGANIZATION">Organization</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="status">Status</Label>
          <Select value={values.status} onValueChange={(value) => setValue("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CANONICAL">Canonical</SelectItem>
              <SelectItem value="PROVISIONAL">Provisional</SelectItem>
              <SelectItem value="DEPRECATED">Deprecated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </form>
  );
}
