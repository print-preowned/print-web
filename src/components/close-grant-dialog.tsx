"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Staff must give a reason; the seller owner may skip it. */
  reasonRequired: boolean;
  placeholder?: string;
  pending: boolean;
  onConfirm: (reason: string | undefined) => void;
};

/** Confirms declining, withdrawing or ending onboarding access, with a reason. */
export function CloseGrantDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  reasonRequired,
  placeholder,
  pending,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  function close(next: boolean) {
    if (!next) setReason("");
    onOpenChange(next);
  }

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      confirmVariant="destructive"
      confirmDisabled={reasonRequired && !trimmed}
      confirmPending={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (reasonRequired && !trimmed) return;
        onConfirm(trimmed || undefined);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="close-grant-reason">
          Reason{reasonRequired ? "" : " (optional)"}
        </Label>
        <Textarea
          id="close-grant-reason"
          rows={3}
          maxLength={500}
          autoFocus
          placeholder={placeholder}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
    </Modal>
  );
}
