"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import z from "zod";
import { createSeller } from "@/lib/api/seller";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, type HttpMethod } from "@/lib/api";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const createSellerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CreateSellerFormProps = {
  onCancel?: () => void;
  submitLabel?: string;
  onSuccess?: () => void;
};

export function CreateSellerForm({
  onCancel,
  submitLabel = "Create storefront",
  onSuccess,
}: CreateSellerFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof createSellerSchema>>({
    resolver: zodResolver(createSellerSchema),
    defaultValues: { name: "", description: "", logo: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createSellerSchema>) => {
      const { endpoint, method, body } = await createSeller(data);
      return apiFetch<{ id?: string }>(endpoint, { method: method as HttpMethod, body });
    },
    onSuccess: async (created) => {
      await refreshSession();
      toast.success("Storefront created");
      if (created?.id) {
        try {
          await apiFetch("/api/auth/context-switch", {
            method: "POST",
            body: { target_context: "SELLER", seller_id: created.id },
            silentStatuses: [400, 401, 403, 422],
          });
          await refreshSession();
          router.push("/seller/dashboard");
          return;
        } catch {
          // stay in customer context
        }
      }
      onSuccess?.();
      router.refresh();
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Storefront name"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Storefront description..."
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
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
