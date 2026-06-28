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
import {
  CreateInviteResponse,
  PlatformInvite,
  readPlatformPrivilegeSets,
  resendPlatformInvite,
} from "@/lib/api/platform";
import { apiFetch } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";

interface ResendInviteDialogProps {
  invite: PlatformInvite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ResendFormValues {
  platform_privilege_set_id: string;
}

export function ResendInviteDialog({
  invite,
  open,
  onOpenChange,
}: ResendInviteDialogProps) {
  const queryClient = useQueryClient();
  const { handleSubmit, control, reset } = useForm<ResendFormValues>();

  const { data: privilegeSetsData, isLoading: isLoadingPrivilegeSets } = useQuery({
    queryKey: ["platform-privilege-sets"],
    queryFn: () => readPlatformPrivilegeSets({ page: 1, size: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (invite && open) {
      reset({
        platform_privilege_set_id: invite.platform_privilege_set_id,
      });
    }
  }, [invite, open, reset]);

  const onSubmit = async (data: ResendFormValues) => {
    if (!invite) return;

    try {
      const request = resendPlatformInvite(invite.id, {
        platform_privilege_set_id: data.platform_privilege_set_id,
      });
      const res = await apiFetch<CreateInviteResponse>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      toast.success(res.message || `Invitation resent to ${invite.email}`);
      queryClient.invalidateQueries({ queryKey: ["platform-invites"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Resend invite error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resend invitation</DialogTitle>
          <DialogDescription>
            Sends a new invite email to {invite?.email}. Previous accept/decline
            links will stop working.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="platform_privilege_set_id">Platform privilege set</Label>
            <Controller
              name="platform_privilege_set_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingPrivilegeSets}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a privilege set" />
                  </SelectTrigger>
                  <SelectContent>
                    {privilegeSetsData?.data?.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoadingPrivilegeSets}>
              Resend invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
