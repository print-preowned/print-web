"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { openOrderDispute } from "@customer/api";
import { ApiError } from "@/lib/api";

const REASON_MAX = 512;

export type DisputeSelectableItem = {
  id: string;
  bookTitle: string;
  authorNames: string[];
  bookCover: string | null;
};

type Props = {
  orderId: string;
  items: DisputeSelectableItem[];
};

export function OrderOpenDisputeButton({ orderId, items }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    items.map((item) => item.id),
  );
  const [pending, setPending] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const trimmed = reason.trim();
  const canSubmit =
    trimmed.length >= 1 &&
    trimmed.length <= REASON_MAX &&
    selectedIds.length >= 1;

  function setItemSelected(itemId: string, selected: boolean) {
    setSelectedIds((current) => {
      if (selected) {
        return current.includes(itemId) ? current : [...current, itemId];
      }
      return current.filter((id) => id !== itemId);
    });
  }

  function resetForm() {
    setReason("");
    setSelectedIds(items.map((item) => item.id));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;

    setPending(true);
    try {
      await openOrderDispute(orderId, {
        reason: trimmed,
        item_ids: selectedIds,
      });
      toast.success("Dispute opened");
      setOpen(false);
      resetForm();
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
          if (pending) return;
          setOpen(next);
          if (!next) resetForm();
        }}
        title="Open a dispute"
        description="Select the items that have a problem."
        onSubmit={handleSubmit}
        confirmLabel={pending ? "Submitting…" : "Submit dispute"}
        confirmDisabled={!canSubmit}
        confirmPending={pending}
      >
        <fieldset className="space-y-3" disabled={pending}>
          <legend className="text-sm font-medium">Items</legend>
          <ul className="space-y-2">
            {items.map((item) => {
              const checkboxId = `dispute-item-${item.id}`;
              const checked = selectedIds.includes(item.id);
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-md border border-border/70 px-3 py-2"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    onCheckedChange={(value) =>
                      setItemSelected(item.id, value === true)
                    }
                    className="mt-0.5"
                  />
                  <label htmlFor={checkboxId} className="min-w-0 cursor-pointer flex flex-row gap-2">
                    {item.bookCover ? <img src={item.bookCover} alt={item.bookTitle} width={30} height={30} /> : null}
                    <div className="flex flex-col gap-1">
                      <span className="block text-sm font-medium leading-snug">
                        {item.bookTitle}
                      </span>
                      {item.authorNames.length > 0 ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          by {" "} <span className="font-semibold">{item.authorNames.join(", ")}</span>
                        </span>
                      ) : null}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

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
