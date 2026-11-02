"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { apiErrorToast } from "@/lib/api";

/** Platform staff moving into a store under an onboarding grant, and back to admin. */
export function useOnboardingSwitch() {
  const { refreshSession } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchTo(body: Record<string, string>, destination: string) {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/auth/context-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const response = await res.json();
      if (!res.ok) {
        toast.error(response.detail ?? "Couldn't switch");
        return;
      }
      await refreshSession();
      router.push(destination);
    } catch (error) {
      apiErrorToast(error, "Couldn't switch");
    } finally {
      setPending(false);
    }
  }

  return {
    pending,
    enterStore: (grantId: string) =>
      switchTo(
        { targetContext: "ONBOARDING", grant_id: grantId },
        "/seller/inventory",
      ),
    backToAdmin: () =>
      switchTo({ targetContext: "PLATFORM" }, "/admin/onboarding"),
  };
}
