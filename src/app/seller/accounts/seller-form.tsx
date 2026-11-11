"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import z from "zod";
import { ProfileImageUpload } from "@/components/profile-image-upload";
import { Seller, createSeller, updateSeller } from "@/lib/api/seller";
import { uploadSellerLogo } from "@/lib/api/profile-image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { useAuth, useSellerId } from "@/lib/auth/context";
import { apiErrorToast } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const editSchema = schema.extend({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type CreateFormValues = z.infer<typeof schema>;
type EditFormValues = z.infer<typeof editSchema>;

type SellerFormProps = {
  seller?: Seller;
  onCancel?: () => void;
  onSuccess?: () => void;
};

function defaultStatus(status: string): "ACTIVE" | "INACTIVE" {
  return status === "ACTIVE" || status === "INACTIVE" ? status : "ACTIVE";
}

export function SellerForm({
  seller,
  onCancel,
  onSuccess,
}: SellerFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const isEdit = !!seller;
  // Logo uploads are scoped to the session's storefront; others are switched to first.
  const currentSellerId = useSellerId();
  const canEditLogo = isEdit && seller.id === currentSellerId;
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditFormValues | CreateFormValues>({
    resolver: zodResolver(isEdit ? editSchema : schema),
    defaultValues: isEdit
      ? {
          name: seller.name,
          description: seller.description ?? "",
          logo: seller.logo ?? "",
          status: defaultStatus(seller.status),
        }
      : {
          name: "",
          description: "",
          logo: "",
        },
  });

  const status = isEdit ? watch("status" as const) : undefined;
  const logo = watch("logo");

  const saveMutation = useApiMutation({
    onSuccess: async () => {
      if (!isEdit) {
        await refreshSession();
      }
      toast.success(isEdit ? "Storefront updated" : "Storefront created");
      onSuccess?.();
      router.refresh();
    },
    onError: (error: Error) => {
      apiErrorToast(error, isEdit ? "Failed to update storefront" : "Failed to create storefront");
    },
  });

  const onSubmitHandler = (values: CreateFormValues | EditFormValues) => {
    if (isEdit) {
      const data = values as EditFormValues;
      saveMutation.mutate(
        updateSeller(seller.id, {
          name: data.name,
          description: data.description || null,
          logo: data.logo || null,
          status: data.status,
        }),
      );
      return;
    }

    const data = values as CreateFormValues;
    saveMutation.mutate(
      createSeller({
        name: data.name,
        description: data.description || null,
        logo: data.logo || null,
      }),
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitHandler)}
      className="flex flex-col gap-4 overflow-y-auto px-4 text-sm"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Storefront name"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Storefront description..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {canEditLogo ? (
        <div className="flex flex-col gap-2">
          <ProfileImageUpload
            id="logo"
            label="Logo"
            shape="square"
            placeholderIcon={Store}
            entityId={seller.id}
            onUpload={uploadSellerLogo}
            value={logo}
            onChange={(url) => setValue("logo", url, { shouldDirty: true })}
            onUploadingChange={setIsLogoUploading}
            disabled={saveMutation.isPending}
          />
          {errors.logo && (
            <p className="text-sm text-red-500">{errors.logo.message}</p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          {isEdit
            ? "Switch to this storefront to change its logo."
            : "Add a logo from Account after switching to the new storefront."}
        </p>
      )}

      {isEdit && status != null && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setValue("status", value as "ACTIVE" | "INACTIVE", {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {"status" in errors && errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saveMutation.isPending || isLogoUploading}>
          {saveMutation.isPending
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create storefront"}
        </Button>
      </div>
    </form>
  );
}
