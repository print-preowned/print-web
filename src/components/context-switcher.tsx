"use client";

import { useState } from "react";
import { useAuth, useBusinessId } from "@/lib/auth/context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useSwitchContext({ targetContext }: { targetContext: "CUSTOMER" | "BUSINESS" }) {
  const { context, refreshSession } = useAuth();
  const businessId = useBusinessId();
  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();

  if (context === targetContext) {
    return {
      handleSwitchContext: () => Promise.resolve(),
      isSwitching: false,
    };
  }

  const handleSwitchContext = async () => {
    if (isSwitching) return;

    setIsSwitching(true);
    try {
      const body: { target_context: string; business_id?: string } = {
        target_context: targetContext,
      };
      if (targetContext === "BUSINESS") {
        if (!businessId) {
          toast.error("No business linked to this account");
          return;
        }
        body.business_id = businessId;
      }

      const res = await fetch("/api/auth/context-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const response = await res.json();

      if (res.ok) {
        await refreshSession();
        toast.success(response.message || `Switched to ${targetContext} context`);
        if (targetContext === "BUSINESS") {
          router.push("/seller/dashboard");
        } else {
          router.push("/");
        }
      } else {
        toast.error(response.detail ?? "Failed to switch context");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to switch context");
    } finally {
      setIsSwitching(false);
    }
  };

  return {
    handleSwitchContext,
    isSwitching,
  };
}
