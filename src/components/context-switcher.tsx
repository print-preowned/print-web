"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/context";
import { switchContext } from "@/lib/api/auth";
import { apiFetch } from "@/lib/api";
import { setCookie } from "@/lib/cookies";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useSwitchContext({ targetContext }: { targetContext: "CUSTOMER" | "BUSINESS" }) {
  const { context, setToken } = useAuth();
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
      const { endpoint, method, body } = switchContext(targetContext);
      const response = await apiFetch<{ status_code: number; message: string; token: string }>(
        endpoint,
        { method: method as "POST", body }
      );

      if (response.token) {
        // Update token in auth context
        setToken(response.token);
        
        // Update cookie
        setCookie("authHeader", response.token, 7);
        
        toast.success(response.message || `Switched to ${targetContext} context`);
        
        // Refresh the page to update all components
        router.refresh();
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

