"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import {
  PlatformUser,
  readPlatformUserMe,
  readPlatformUsers,
  transferSuperAdmin,
} from "@/lib/api/platform";
import { apiFetch } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function AdminAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuth();
  const [transferOpen, setTransferOpen] = useState(false);
  const [targetPlatformUserId, setTargetPlatformUserId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const { data: meResponse, isLoading: isLoadingMe } = useQuery({
    queryKey: ["platform-user-me"],
    queryFn: readPlatformUserMe,
  });

  const me = meResponse?.data;

  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["platform-users-transfer-targets"],
    queryFn: () =>
      apiFetch<{ data: PlatformUser[] }>(readPlatformUsers({ page: 1, size: 100 })),
    enabled: me?.is_super_admin === true && transferOpen,
  });
  const transferTargets = useMemo(
    () =>
      (usersResponse?.data ?? []).filter(
        (user) => user.id !== me?.id && !user.is_super_admin,
      ),
    [usersResponse?.data, me?.id],
  );

  const handleTransfer = async () => {
    if (!targetPlatformUserId) {
      toast.error("Select a platform user to transfer the role to");
      return;
    }

    setIsTransferring(true);
    try {
      const request = transferSuperAdmin({
        target_platform_user_id: targetPlatformUserId,
      });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      toast.success("Super admin role transferred. Sign in again with your new permissions.");
      setTransferOpen(false);
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      clearAuth();
      router.push("/admin/login");
    } catch (error) {
      console.error("Transfer super admin error:", error);
    } finally {
      setIsTransferring(false);
    }
  };

  if (isLoadingMe) {
    return <p className="text-muted-foreground">Loading account…</p>;
  }

  if (!me) {
    return <p className="text-destructive">Failed to load account details.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground">
          Your platform account details and security settings.
        </p>
      </div>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-medium">Profile</h2>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Name</dt>
            <dd>{me.user_name?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Email</dt>
            <dd>{me.user_email || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Role</dt>
            <dd>{me.platform_privilege_set_name || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Status</dt>
            <dd>{me.status}</dd>
          </div>
        </dl>
      </section>

      {me.is_super_admin && (
        <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-medium text-destructive">Transfer super admin</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Give the super admin role to another platform user. You will be
              moved to Admin and signed out immediately. This cannot be undone
              from the users table.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setTransferOpen(true)}>
            Transfer super admin role
          </Button>
        </section>
      )}

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer super admin role</DialogTitle>
            <DialogDescription>
              Choose who should become the new super admin. You will lose super
              admin access and be signed out.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="transfer-target">New super admin</Label>
            <Select
              value={targetPlatformUserId}
              onValueChange={setTargetPlatformUserId}
              disabled={isLoadingUsers}
            >
              <SelectTrigger id="transfer-target">
                <SelectValue
                  placeholder={
                    isLoadingUsers
                      ? "Loading platform users…"
                      : "Select a platform user"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {transferTargets.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.user_name?.trim() || user.user_email || user.id}
                    {user.platform_privilege_set_name
                      ? ` (${user.platform_privilege_set_name})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransferOpen(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleTransfer}
              disabled={isTransferring || !targetPlatformUserId}
            >
              {isTransferring ? "Transferring…" : "Transfer and sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
