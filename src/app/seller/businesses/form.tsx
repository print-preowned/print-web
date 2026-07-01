"use client";

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
import { Business, createBusiness, updateBusiness } from "@/lib/api/business";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
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

type BusinessFormProps = {
  business?: Business;
  onCancel?: () => void;
  onSuccess?: () => void;
};

function defaultStatus(status: string): "ACTIVE" | "INACTIVE" {
  return status === "ACTIVE" || status === "INACTIVE" ? status : "ACTIVE";
}

export function BusinessForm({
  business,
  onCancel,
  onSuccess,
}: BusinessFormProps) {
  const router = useRouter();
  const isEdit = !!business;

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
          name: business.name,
          description: business.description ?? "",
          logo: business.logo ?? "",
          status: defaultStatus(business.status),
        }
      : {
          name: "",
          description: "",
          logo: "",
        },
  });

  const status = isEdit ? watch("status" as const) : undefined;

  const saveMutation = useApiMutation({
    onSuccess: () => {
      toast.success(isEdit ? "Business updated" : "Business created successfully!");
      onSuccess?.();
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || (isEdit ? "Failed to update business" : "Failed to create business"));
    },
  });

  const onSubmitHandler = (values: CreateFormValues | EditFormValues) => {
    if (isEdit) {
      const data = values as EditFormValues;
      saveMutation.mutate(
        updateBusiness(business.id, {
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
      createBusiness({
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
          placeholder="Business Name"
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
          placeholder="Business description..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="logo">Logo URL</Label>
        <Input
          id="logo"
          {...register("logo")}
          type="url"
          placeholder="https://example.com/logo.png"
          className={errors.logo ? "border-red-500" : ""}
        />
        {errors.logo && (
          <p className="text-sm text-red-500">{errors.logo.message}</p>
        )}
      </div>

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
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create business"}
        </Button>
      </div>
    </form>
  );
}
