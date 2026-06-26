"use client";

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
import type { Business } from "@/lib/api/business";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type BusinessDetailsFormValues = z.infer<typeof schema>;

type BusinessDetailsFormProps = {
  business: Business;
  onSubmit: (values: BusinessDetailsFormValues) => void;
  isPending?: boolean;
};

export function BusinessDetailsForm({
  business,
  onSubmit,
  isPending = false,
}: BusinessDetailsFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessDetailsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: business.name,
      description: business.description ?? "",
      logo: business.logo ?? "",
      status: (business.status === "ACTIVE" || business.status === "INACTIVE" ? business.status : "ACTIVE") as "ACTIVE" | "INACTIVE",
    },
  });

  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6 rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Business name"
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
          placeholder="Short description of your business"
          rows={4}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo URL</Label>
        <Input
          id="logo"
          {...register("logo")}
          type="url"
          placeholder="https://example.com/logo.png"
          className={errors.logo ? "border-destructive" : ""}
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

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
