"use client"

import { Button } from "@/components/ui/button";
import { rejectPlatformInvite } from "@/lib/api/platform";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

interface RejectInviteFormProps {
  token: string;
  onRejected: () => void;
}

export function RejectInviteForm({ token, onRejected }: RejectInviteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const request = rejectPlatformInvite({ token });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });

      toast.success("Invitation declined.");
      onRejected();
    } catch (error: unknown) {
      console.error("Reject invite error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      className="w-full"
      disabled={isSubmitting}
      onClick={handleReject}
    >
      {isSubmitting ? "Declining..." : "Decline Invitation"}
    </Button>
  );
}
