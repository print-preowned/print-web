"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { openOrderDispute } from "@customer/api";
import { ApiError } from "@/lib/api";

const REASON_MAX = 512;

type Props = {
  orderId: string;
  canOpenDispute: boolean;
};

export function OrderOpenDisputeButton({ orderId, canOpenDispute }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  if (!canOpenDispute) {
    return null;
  }

  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= 1 && trimmed.length <= REASON_MAX;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;

    setPending(true);
    try {
      await openOrderDispute(orderId, { reason: trimmed });
      toast.success("Dispute opened");
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not open dispute. Try again.";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Open dispute
      </Button>

      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
        title="Open a dispute"
        description="Describe the issue with this order. Our team will review it and get back to you as soon as possible."
        onSubmit={handleSubmit}
        confirmLabel={pending ? "Submitting…" : "Submit dispute"}
        confirmDisabled={!canSubmit}
        confirmPending={pending}
      >
        <div className="space-y-2">
          <Label htmlFor="dispute-reason">Reason</Label>
          <Textarea
            id="dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={REASON_MAX}
            rows={4}
            required
            placeholder="What went wrong?"
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            {trimmed.length}/{REASON_MAX}
          </p>
        </div>
      </Modal>
    </>
  );
}
