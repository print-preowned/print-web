"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
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
import { ProfileImageUpload } from "@/components/profile-image-upload";
import type { Seller } from "@/lib/api/seller";
import { uploadSellerLogo } from "@/lib/api/profile-image";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type SellerDetailsFormValues = z.infer<typeof schema>;

type SellerDetailsFormProps = {
  seller: Seller;
  onSubmit: (values: SellerDetailsFormValues) => void;
  isPending?: boolean;
};

export function SellerDetailsForm({
  seller,
  onSubmit,
  isPending = false,
}: SellerDetailsFormProps) {
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SellerDetailsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: seller.name,
      description: seller.description ?? "",
      logo: seller.logo ?? "",
      status: (seller.status === "ACTIVE" || seller.status === "INACTIVE" ? seller.status : "ACTIVE") as "ACTIVE" | "INACTIVE",
    },
  });

  const status = watch("status");
  const logo = watch("logo");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6 rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="name">Storefront name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Storefront name"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Short description of your storefront"
          rows={4}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
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
          disabled={isPending}
        />
        {errors.logo && (
          <p className="text-sm text-destructive">{errors.logo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(v) => setValue("status", v as "ACTIVE" | "INACTIVE")}
        >
          <SelectTrigger id="status" className={errors.status ? "border-destructive" : ""}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-destructive">{errors.status.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending || isLogoUploading}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
