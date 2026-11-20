"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { backToAdmin } from "@/lib/auth/seller-session";
import { useOnboardingGrantId, useSellerId } from "@/lib/auth/context";
import { apiFetch } from "@/lib/api";
import { readSellerById, type Seller } from "@/lib/api/seller";
import type { BaseResponse } from "@/lib/model";

/** Shown on every seller page while platform staff work in a store under a grant. */
export function OnboardingBanner() {
  const grantId = useOnboardingGrantId();
  const sellerId = useSellerId();
  const [pending, setPending] = useState(false);
  const seller = useQuery({
    queryKey: ["seller", sellerId],
    queryFn: () =>
      apiFetch(readSellerById(sellerId!)) as Promise<BaseResponse<Seller>>,
    enabled: grantId != null && sellerId != null,
  });

  if (!grantId) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <p>
        <span className="font-medium">
          Onboarding {seller.data?.data?.name ?? "this store"}.
        </span>{" "}
        Everything you add is saved as a draft for the seller to publish.
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void backToAdmin();
        }}
      >
        Back to admin
      </Button>
    </div>
  );
}
