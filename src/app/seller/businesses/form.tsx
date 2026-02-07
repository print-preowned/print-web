"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import z from "zod";
import { Business, createBusiness } from "@/lib/api/business";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, HttpMethod } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type BusinessFormProps = {
  business?: Business;
  onCancel?: () => void;
  isPending?: boolean;
  submitLabel?: string;
  showActions?: boolean;
  setIsCreating?: (isCreating: boolean) => void;
};

export function BusinessForm({ 
  business, 
  onCancel,
  submitLabel = "Submit",
  showActions = true,
  setIsCreating,
}: BusinessFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: business
      ? {
          name: business.name,
          description: business.description || "",
          logo: business.logo || "",
        }
      : {
          name: "",
          description: "",
          logo: "",
        },
  });


  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      const { endpoint, method, body } = await createBusiness(data);
      return apiFetch(endpoint, { method: method as HttpMethod, body });
    },
    onSuccess: () => {
      toast.success("Business created successfully!");
      setIsCreating?.(false);
      // Optionally redirect or refresh
      router.refresh();
    },
  });

  const onSubmitHandler = (data: z.infer<typeof schema>) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Business Name"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Business description..."
          rows={4}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
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
        {errors.logo && <p className="text-sm text-red-500">{errors.logo.message}</p>}
      </div>

      {showActions && (
        <div className="flex gap-2 mt-4">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Submitting..." : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

