"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Handshake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { CloseGrantDialog } from "@/components/close-grant-dialog";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { apiErrorToast } from "@/lib/api";
import {
  ACCESS_GRANT_STATUS_LABELS,
  decideAccessGrant,
  readSellerAccessGrants,
  timeLeft,
  type AccessGrant,
} from "@/lib/api/access-grants";
import { accessGrantKeys } from "@/lib/api/query-keys";

const DECISION_TOASTS = {
  approve: "Access approved",
  decline: "Request declined",
  revoke: "Access revoked",
} as const;

/** Owner-only: approve, decline or revoke Print's onboarding access to this store. */
export function OnboardingAccessPanel() {
  const queryClient = useQueryClient();
  const grants = useApiQuery<AccessGrant[]>(
    accessGrantKeys.seller(),
    readSellerAccessGrants(),
  );
  const [closing, setClosing] = useState<{
    grant: AccessGrant;
    decision: "decline" | "revoke";
  } | null>(null);
  const decide = useApiMutation({
    onError: (error: Error) => apiErrorToast(error, "Couldn't update access"),
  });

  function act(
    grant: AccessGrant,
    decision: keyof typeof DECISION_TOASTS,
    reason?: string,
  ) {
    decide.mutate(decideAccessGrant(grant.id, decision, reason), {
      onSuccess: () => {
        setClosing(null);
        toast.success(DECISION_TOASTS[decision]);
        void queryClient.invalidateQueries({ queryKey: accessGrantKeys.all });
      },
    });
  }

  const open =
    grants.data?.filter(
      (g) => g.status === "PENDING" || g.status === "ACTIVE",
    ) ?? [];
  const past = grants.data?.filter((g) => !open.includes(g)) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="size-5" aria-hidden />
          Onboarding help
        </CardTitle>
        <CardDescription>
          Print&apos;s onboarding team can add your books for you. They save
          everything as drafts; you check prices and publish. Access lasts up to
          14 days and you can end it at any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {grants.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : open.length ? (
          open.map((grant) => (
            <div key={grant.id} className="space-y-3 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={grant.status}
                  label={
                    grant.status === "PENDING" ? "Waiting for you" : "Active"
                  }
                />
                <span className="text-muted-foreground text-sm">
                  {grant.status === "ACTIVE" && grant.expiresAt
                    ? `Print can add drafts until ${new Date(grant.expiresAt).toLocaleString()} (${timeLeft(grant.expiresAt)})`
                    : `Print is asking for ${grant.durationDays} days of access`}
                </span>
              </div>
              {grant.note ? (
                <p className="text-sm">&ldquo;{grant.note}&rdquo;</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {grant.status === "PENDING" ? (
                  <>
                    <Button
                      size="sm"
                      disabled={decide.isPending}
                      onClick={() => act(grant, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decide.isPending}
                      onClick={() => setClosing({ grant, decision: "decline" })}
                    >
                      Decline
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decide.isPending}
                    onClick={() => setClosing({ grant, decision: "revoke" })}
                  >
                    End access
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            No requests. Contact Print if you&apos;d like help adding a large
            stock.
          </p>
        )}

        {past.length ? (
          <details className="text-sm">
            <summary className="text-muted-foreground cursor-pointer">
              Past access
            </summary>
            <ul className="mt-2 space-y-1">
              {past.map((grant) => (
                <li
                  key={grant.id}
                  className="text-muted-foreground flex flex-wrap gap-x-2"
                >
                  <span>{new Date(grant.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{ACCESS_GRANT_STATUS_LABELS[grant.status]}</span>
                  {grant.closeReason ? (
                    <>
                      <span>·</span>
                      <span>{grant.closeReason}</span>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
      <CloseGrantDialog
        open={closing !== null}
        onOpenChange={(next) => !next && setClosing(null)}
        title={
          closing?.decision === "revoke"
            ? "End Print's access now?"
            : "Decline this request?"
        }
        description={
          closing?.decision === "revoke"
            ? "Print's team is signed out of your store straight away. Drafts they added stay in your inventory."
            : "Print's team will see your reason, if you give one."
        }
        confirmLabel={closing?.decision === "revoke" ? "End access" : "Decline"}
        reasonRequired={false}
        placeholder={
          closing?.decision === "revoke"
            ? "e.g. I'll finish adding the rest myself"
            : "e.g. Not now, maybe next month"
        }
        pending={decide.isPending}
        onConfirm={(reason) =>
          closing && act(closing.grant, closing.decision, reason)
        }
      />
    </Card>
  );
}
