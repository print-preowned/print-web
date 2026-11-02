"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { apiErrorToast } from "@/lib/api";
import {
  MAX_GRANT_DAYS,
  requestAccessGrant,
  searchOnboardingSellers,
  type OnboardingSellerOption,
} from "@/lib/api/access-grants";
import { accessGrantKeys } from "@/lib/api/query-keys";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function RequestAccessDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [seller, setSeller] = useState<OnboardingSellerOption | null>(null);
  const [days, setDays] = useState(String(MAX_GRANT_DAYS));
  const [note, setNote] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const sellers = useApiQuery<OnboardingSellerOption[]>(
    accessGrantKeys.sellers(debounced),
    searchOnboardingSellers(debounced),
    { enabled: open && debounced.length >= 2 },
  );

  const request = useApiMutation({
    onSuccess: () => {
      toast.success(
        "Request sent. The seller approves it from their account page.",
      );
      void queryClient.invalidateQueries({ queryKey: accessGrantKeys.all });
      close(false);
    },
    onError: (error: Error) =>
      apiErrorToast(error, "Couldn't send the request"),
  });

  function close(next: boolean) {
    if (!next) {
      setSearch("");
      setSeller(null);
      setDays(String(MAX_GRANT_DAYS));
      setNote("");
    }
    onOpenChange(next);
  }

  const durationDays = Number(days);
  const validDays =
    Number.isInteger(durationDays) &&
    durationDays >= 1 &&
    durationDays <= MAX_GRANT_DAYS;

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title="Request store access"
      description="Talk to the seller first. They'll see this request on their account page and approve or decline it."
      confirmLabel="Send request"
      confirmDisabled={!seller || !validDays}
      confirmPending={request.isPending}
      onSubmit={(event) => {
        event.preventDefault();
        if (!seller || !validDays) return;
        request.mutate(
          requestAccessGrant({
            sellerId: seller.id,
            durationDays,
            ...(note.trim() ? { note: note.trim() } : {}),
          }),
        );
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="grant-store">Store</Label>
          <Input
            id="grant-store"
            placeholder="Search by store name"
            value={search}
            autoFocus
            onChange={(event) => {
              setSearch(event.target.value);
              setSeller(null);
            }}
          />
          {debounced.length >= 2 && !seller ? (
            <ul className="max-h-48 overflow-y-auto rounded-md border">
              {sellers.isLoading ? (
                <li className="text-muted-foreground p-2 text-sm">
                  Searching…
                </li>
              ) : sellers.data?.length ? (
                sellers.data.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
                      onClick={() => {
                        setSeller(option);
                        setSearch(option.name);
                      }}
                    >
                      {option.name}
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground p-2 text-sm">
                  No stores match.
                </li>
              )}
            </ul>
          ) : null}
          {seller ? (
            <p className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-500">
              <Check className="size-3.5" aria-hidden />
              {seller.name}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="grant-days">Days of access</Label>
          <Input
            id="grant-days"
            type="number"
            inputMode="numeric"
            className={cn("w-18", !validDays && "border-destructive")}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Up to {MAX_GRANT_DAYS}. The clock starts when the seller approves.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="grant-note">Note for the seller</Label>
          <Textarea
            id="grant-note"
            rows={2}
            maxLength={500}
            placeholder="e.g. Adding ~2,000 books from your Yaba store"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
