"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { StatusBadge } from "@/components/status-badge";
import { CloseGrantDialog } from "@/components/close-grant-dialog";
import { useOnboardingSwitch } from "@/components/onboarding-switch";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { apiErrorToast } from "@/lib/api";
import {
  ACCESS_GRANT_STATUS_LABELS,
  readStaffAccessGrants,
  timeLeft,
  withdrawAccessGrant,
  type AccessGrant,
} from "@/lib/api/access-grants";
import { accessGrantKeys } from "@/lib/api/query-keys";
import { RequestAccessDialog } from "./request-access-dialog";

export default function AdminOnboardingPage() {
  const [openOnly, setOpenOnly] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const grants = useApiQuery<AccessGrant[]>(
    accessGrantKeys.staff(openOnly),
    readStaffAccessGrants(openOnly),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Store onboarding</h1>
          <p className="text-muted-foreground max-w-prose text-sm">
            Request access to a seller&apos;s store to add their inventory for
            them. The seller approves it, for up to 14 days. Everything you add
            is saved as a draft; the seller prices what&apos;s left and
            publishes.
          </p>
        </div>
        <Button onClick={() => setRequesting(true)}>
          <Plus className="mr-2 size-4" />
          Request access
        </Button>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={openOnly ? "open" : "all"}
        onValueChange={(value) => value && setOpenOnly(value === "open")}
        aria-label="Filter requests"
      >
        <ToggleGroupItem value="open" className="px-3">
          Open
        </ToggleGroupItem>
        <ToggleGroupItem value="all" className="px-3">
          All
        </ToggleGroupItem>
      </ToggleGroup>

      {grants.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : grants.data?.length ? (
        <ul className="divide-y rounded-md border">
          {grants.data.map((grant) => (
            <GrantRow key={grant.id} grant={grant} />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          {openOnly ? "No open requests." : "No requests yet."}
        </p>
      )}

      <RequestAccessDialog open={requesting} onOpenChange={setRequesting} />
    </div>
  );
}

function GrantRow({ grant }: { grant: AccessGrant }) {
  const queryClient = useQueryClient();
  const { enterStore, pending } = useOnboardingSwitch();
  const [closing, setClosing] = useState(false);
  const withdraw = useApiMutation({
    onSuccess: () => {
      setClosing(false);
      toast.success(
        grant.status === "PENDING" ? "Request withdrawn" : "Access ended",
      );
      void queryClient.invalidateQueries({ queryKey: accessGrantKeys.all });
    },
    onError: (error: Error) =>
      apiErrorToast(error, "Couldn't update the request"),
  });

  const live = grant.status === "ACTIVE";
  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {grant.sellerName ?? "Unknown store"}
          </span>
          <StatusBadge
            status={grant.status}
            label={ACCESS_GRANT_STATUS_LABELS[grant.status]}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {live && grant.expiresAt
            ? `Access ends ${timeLeft(grant.expiresAt)}`
            : grant.status === "PENDING"
              ? `Requested ${new Date(grant.createdAt).toLocaleDateString()} · ${grant.durationDays} days once approved`
              : `Requested ${new Date(grant.createdAt).toLocaleDateString()}`}
          {grant.note ? ` · ${grant.note}` : ""}
        </p>
        {grant.closeReason ? (
          <p className="text-muted-foreground text-xs">
            Reason: {grant.closeReason}
          </p>
        ) : null}
      </div>
      {live ? (
        <Button
          size="sm"
          onClick={() => void enterStore(grant.id)}
          disabled={pending}
        >
          <LogIn className="mr-2 size-4" />
          Enter store
        </Button>
      ) : null}
      {live || grant.status === "PENDING" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={withdraw.isPending}
          onClick={() => setClosing(true)}
        >
          {live ? "End access" : "Withdraw"}
        </Button>
      ) : null}
      <CloseGrantDialog
        open={closing}
        onOpenChange={setClosing}
        title={live ? "End access to this store?" : "Withdraw this request?"}
        description={
          live
            ? "The seller would need to approve a new request. They'll see your reason."
            : "The seller will see your reason."
        }
        confirmLabel={live ? "End access" : "Withdraw"}
        reasonRequired
        placeholder={
          live
            ? "e.g. Done: 1,240 drafts added for the seller to price"
            : "e.g. Seller wants to wait until after stocktake"
        }
        pending={withdraw.isPending}
        onConfirm={(reason) =>
          withdraw.mutate(withdrawAccessGrant(grant.id, reason ?? ""))
        }
      />
    </li>
  );
}
