"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@customer/api";
import { ApiError } from "@/lib/api";
import {
  canCustomerCancelOrder,
  getCustomerCancelConfirmDescription,
} from "@/lib/order-status";

type Props = {
  orderId: string;
  status: string;
  paymentStatus?: string;
};

export function OrderCancelButton({ orderId, status, paymentStatus }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);

  if (!canCustomerCancelOrder(status)) {
    return null;
  }

  async function handleCancel() {
    const confirmed = await confirm({
      title: "Cancel this order?",
      description: getCustomerCancelConfirmDescription(paymentStatus),
      confirmLabel: "Cancel order",
      cancelLabel: "Keep order",
      destructive: true,
    });
    if (!confirmed) return;

    setPending(true);
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not cancel order. Try again.";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={handleCancel}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {pending ? "Cancelling…" : "Cancel order"}
    </Button>
  );
}
