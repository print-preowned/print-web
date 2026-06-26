"use client";

import { useBusinessId, useIsOwner } from "@/lib/auth/context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Business, readBusinessById, updateBusiness } from "@/lib/api/business";
import type { HttpMethod } from "@/lib/api";
import { toast } from "sonner";
import { BusinessDetailsForm } from "./business-details-form";

type BusinessResponse = { data: Business; message?: string; status_code?: number };

export default function SellerAccountPage() {
  const businessId = useBusinessId();
  const isOwner = useIsOwner();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [readBusinessById(businessId!)],
    queryFn: () => apiFetch(readBusinessById(businessId!)) as Promise<BusinessResponse>,
    enabled: !!businessId,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { name?: string; description?: string | null; logo?: string | null; status?: string }) => {
      const { endpoint, method, body } = updateBusiness(businessId!, payload);
      return apiFetch(endpoint, { method: method as HttpMethod, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [readBusinessById(businessId!)] });
      toast.success("Business details updated");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update business");
    },
  });

  const business = data?.data;

  if (!businessId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No business context. Switch to a business to manage its details.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Failed to load business details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">Manage your business details.</p>
      </div>

      {isOwner ? (
        <BusinessDetailsForm
          business={business}
          onSubmit={(values) => updateMutation.mutate(values)}
          isPending={updateMutation.isPending}
        />
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4 text-muted-foreground">
          Only the business owner can edit these details. You can view them below.
          <dl className="mt-3 grid gap-1 text-sm">
            <div>
              <dt className="font-medium text-foreground">Name</dt>
              <dd>{business.name}</dd>
            </div>
            {business.description && (
              <div>
                <dt className="font-medium text-foreground">Description</dt>
                <dd>{business.description}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-foreground">Status</dt>
              <dd>{business.status}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
